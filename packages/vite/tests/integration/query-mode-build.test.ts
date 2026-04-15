import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { build, type Rollup } from 'vite';
import { z2fVite } from '../../src/index.js';

/**
 * Integration: build-mode end-to-end via Vite's programmatic `build()`.
 *
 * Exercises the build-mode schema loading path (transient SSR server)
 * end-to-end and asserts the emitted bundle contains the generated form
 * source. The schema files live inside the in-monorepo fixture so `zod`
 * resolves through the workspace, but each test writes uniquely-named
 * files to keep parallel test runs isolated.
 *
 * `write: false` keeps the build in-memory — we read from the returned
 * RollupOutput rather than the filesystem. This makes the test fast and
 * doesn't pollute the fixture's dist/ directory.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/query-minimal');
const SCHEMAS_DIR = path.join(FIXTURE_ROOT, 'src/schemas');

let createdFiles: string[] = [];

const SIGNUP_SCHEMA = `import { z } from 'zod';
export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});
`;

async function writeUniqueSchema(prefix: string, content: string): Promise<string> {
  const name = `${prefix}-${randomUUID().slice(0, 8)}.ts`;
  const full = path.join(SCHEMAS_DIR, name);
  await fs.writeFile(full, content);
  createdFiles.push(full);
  return `./schemas/${name}`;
}

async function runBuild(entryRel: string): Promise<Rollup.RollupOutput> {
  const entryFile = path.join(FIXTURE_ROOT, `src/build-entry-${randomUUID().slice(0, 8)}.ts`);
  createdFiles.push(entryFile);
  // The entry just re-exports the generated form so Rollup keeps it in
  // the output. Without an entry that references the virtual module,
  // Rollup tree-shakes it away.
  await fs.writeFile(
    entryFile,
    `import { GeneratedForm } from '${entryRel}?z2f';\nexport { GeneratedForm };\n`
  );

  const result = await build({
    root: FIXTURE_ROOT,
    configFile: false,
    plugins: [
      z2fVite({
        configOverride: {
          componentName: 'GeneratedForm',
          mode: 'submit',
          ui: 'html'
        },
        logLevel: 'silent'
      })
    ],
    logLevel: 'silent',
    build: {
      lib: {
        entry: entryFile,
        formats: ['es'],
        fileName: 'bundle'
      },
      write: false,
      minify: false,
      // External everything except our generated module so the test
      // doesn't try to bundle react / react-hook-form / @hookform/resolvers
      // (which aren't fixture deps).
      rollupOptions: {
        external: (id): boolean => {
          if (id.includes('?z2f')) return false;
          if (id.startsWith('.') || id.startsWith('/')) return false;
          return true;
        }
      }
    }
  });

  if (Array.isArray(result)) {
    return result[0]!;
  }
  if ('output' in result) {
    return result;
  }
  throw new Error('unexpected build() return shape');
}

beforeEach(() => {
  createdFiles = [];
});

afterEach(async () => {
  for (const f of createdFiles) {
    await fs.rm(f, { force: true });
  }
});

describe('query-mode build integration', () => {
  it('build-mode output for a schema is structurally identical to dev-mode compileTarget output (SC-006)', async () => {
    // Closes the SC-006 parity gap: the build-mode SSR-server loader
    // path MUST produce equivalent output to the dev-mode ssrLoadModule
    // path. Both go through `compileTarget` so the TSX source is the
    // same; the build path additionally runs esbuild to strip JSX. We
    // run the dev-mode TSX through the SAME esbuild transform here so
    // the two end states are apples-to-apples comparable.
    const { z } = await import('zod');
    const { transformWithEsbuild } = await import('vite');
    const { compileTarget } = await import('../../src/query-mode/transform.js');

    const namespace = {
      signupSchema: z.object({
        name: z.string().min(2),
        email: z.string().email()
      })
    };
    const devResult = compileTarget({
      namespace,
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: '',
      config: {
        componentName: 'GeneratedForm',
        mode: 'submit',
        ui: 'html',
        exportName: 'signupSchema',
        schemaImportPath: './signup.ts'
      }
    });
    // Mirror the plugin's load hook: run esbuild over the TSX so JSX
    // and types are stripped just like the build path produces.
    const devEsbuild = await transformWithEsbuild(
      devResult.generatedSource,
      '/abs/src/schemas/signup.ts.tsx',
      { loader: 'tsx', sourcemap: false }
    );
    const devBody = devEsbuild.code.match(/function\s+GeneratedForm[\s\S]*?\n\}/)?.[0];
    expect(devBody).toBeDefined();

    // Build path: write the matching schema into the fixture and run a
    // real build. The build-mode SSR loader spins up its transient
    // server and feeds the schema through the same compileTarget.
    const rel = await writeUniqueSchema('signup', SIGNUP_SCHEMA);
    const output = await runBuild(rel);
    const allCode = output.output
      .filter((c): c is Rollup.OutputChunk => c.type === 'chunk')
      .map((c) => c.code)
      .join('\n');
    const buildBody = allCode.match(/function\s+GeneratedForm[\s\S]*?\n\}/)?.[0];
    expect(buildBody).toBeDefined();

    // Both bodies were produced by the same `compileTarget` function
    // fed the same schema — but byte-identical comparison at this
    // level is too strict: Rollup re-optimizes the build output
    // (inlining single-use `const form = useForm(...)` into its
    // destructuring consumer, re-indenting with tabs, collapsing
    // spread attribute objects). Those are downstream bundler
    // optimizations, not drift in the plugin's input to codegen.
    //
    // Assert STRUCTURAL parity instead: both bodies must contain the
    // same field identifiers, the same schema reference, and the same
    // handleSubmit shape. This pins "the build-mode SSR loader feeds
    // the right namespace" without locking in Rollup's formatting.
    const structuralMarkers = [
      'useForm',
      '_resolver',
      'handleSubmit',
      'register',
      '"name"',
      '"email"'
    ];
    for (const marker of structuralMarkers) {
      expect(devBody, `dev body missing marker '${marker}'`).toContain(marker);
      expect(buildBody, `build body missing marker '${marker}'`).toContain(marker);
    }
  });

  it('emits a bundle that contains the generated form component', async () => {
    const rel = await writeUniqueSchema('signup', SIGNUP_SCHEMA);
    const output = await runBuild(rel);

    // Find the chunk that contains the generated form code.
    const chunks = output.output.filter((c): c is Rollup.OutputChunk => c.type === 'chunk');
    expect(chunks.length).toBeGreaterThan(0);

    const allCode = chunks.map((c) => c.code).join('\n');
    // The generated component name must appear in an actual declaration.
    expect(allCode).toMatch(/(function|const)\s+GeneratedForm\b|class\s+GeneratedForm\b/);
    // The generated source still references the schema export.
    expect(allCode).toContain('signupSchema');
  });

  it('preserves variant-specific output when ?z2f=variant is used', async () => {
    // No variant config is supplied so the variant import will throw
    // UNKNOWN_VARIANT — verify the build surfaces it as a typed error
    // rather than crashing silently.
    const rel = await writeUniqueSchema('signup', SIGNUP_SCHEMA);
    await expect(
      (async () => {
        const entryFile = path.join(FIXTURE_ROOT, `src/build-entry-${randomUUID().slice(0, 8)}.ts`);
        createdFiles.push(entryFile);
        await fs.writeFile(
          entryFile,
          `import { GeneratedForm } from '${rel}?z2f=nope';\nexport { GeneratedForm };\n`
        );
        return build({
          root: FIXTURE_ROOT,
          configFile: false,
          plugins: [
            z2fVite({
              configOverride: {
                componentName: 'GeneratedForm',
                mode: 'submit',
                ui: 'html'
              },
              logLevel: 'silent'
            })
          ],
          logLevel: 'silent',
          build: {
            lib: { entry: entryFile, formats: ['es'], fileName: 'bundle' },
            write: false,
            rollupOptions: {
              external: (id): boolean =>
                !(id.includes('?z2f') || id.startsWith('.') || id.startsWith('/'))
            }
          }
        });
      })()
    ).rejects.toThrow(/Z2F_VITE_UNKNOWN_VARIANT/);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { build, type Rollup } from 'vite';
import { z2fVite } from '../../src/index.js';

/**
 * Integration: generate-mode end-to-end via Vite's programmatic `build()`.
 *
 * We use `build()` rather than `createServer()` because the dev-server
 * transform pipeline wraps `pluginContainer.transform` with import
 * analysis + dep optimization, which fights us when the test feeds raw
 * source in. `build()` runs the same transform hook as part of a real
 * Rollup build — it's the actual code path users hit when they `vite
 * build` with generate mode enabled.
 *
 * The fixture's `App.tsx` contains a happy-path `<ZodForm schema={X}>`
 * site. We externalize react / react-hook-form / @zod-to-form/react so
 * the bundle stays self-contained without bringing the runtime into
 * the test.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/generate-project');
const APP_PATH = path.join(FIXTURE_ROOT, 'src/App.tsx');
const ORIGINAL_APP = await fs.readFile(APP_PATH, 'utf8');

let createdFiles: string[] = [];

async function runBuild(options: {
  generate: boolean;
  logLevel?: 'silent' | 'info' | 'debug';
}): Promise<{ output: Rollup.RollupOutput; entryFile: string }> {
  // Each build gets a unique entry file so parallel runs don't collide.
  const entryFile = path.join(FIXTURE_ROOT, `src/entry-${randomUUID().slice(0, 8)}.tsx`);
  createdFiles.push(entryFile);
  await fs.writeFile(entryFile, `export { App } from './App.tsx';\n`);

  const result = await build({
    root: FIXTURE_ROOT,
    configFile: false,
    plugins: [
      z2fVite({
        ...(options.generate ? { generate: {} } : {}),
        configOverride: {
          componentName: 'SignupForm',
          mode: 'submit',
          ui: 'html'
        },
        logLevel: options.logLevel ?? 'silent'
      })
    ],
    logLevel: 'silent',
    build: {
      lib: { entry: entryFile, formats: ['es'], fileName: 'bundle' },
      write: false,
      minify: false,
      rollupOptions: {
        external: (id): boolean => {
          if (id.includes('?z2f')) return false;
          if (id.startsWith('.') || id.startsWith('/')) return false;
          // Externalize EVERYTHING from node_modules and bare specifiers
          // (react, @zod-to-form/react, react-hook-form, etc.). The test
          // doesn't need them resolved.
          return true;
        }
      }
    }
  });

  const output = Array.isArray(result) ? result[0]! : (result as Rollup.RollupOutput);
  return { output, entryFile };
}

beforeEach(() => {
  createdFiles = [];
});

afterEach(async () => {
  for (const f of createdFiles) {
    await fs.rm(f, { force: true });
  }
  // Restore App.tsx in case a test mutated it (none currently do, but be safe).
  await fs.writeFile(APP_PATH, ORIGINAL_APP);
});

function joinChunks(output: Rollup.RollupOutput): string {
  return output.output
    .filter((c): c is Rollup.OutputChunk => c.type === 'chunk')
    .map((c) => c.code)
    .join('\n');
}

describe('generate-mode integration', () => {
  it('rewrites <ZodForm schema={X}> into a generated component when rewrite is enabled', async () => {
    const { output } = await runBuild({ generate: true });
    const code = joinChunks(output);

    // Original ZodForm JSX element gone.
    expect(code).not.toMatch(/createElement\(\s*ZodForm\b/);
    // Rewrite-mode variants emit the generated component under the
    // fixed name `Form` (decoupled from the user's componentName). The
    // per-site `_z2fGeneratedForm_<n>` alias gets tree-shaken away by
    // Rollup since it's used at exactly one call site, but the
    // generated `function Form` body must still appear in the bundle.
    expect(code).toMatch(/(function|const)\s+Form\b/);
    // The schema export the codegen consumes must also survive in the
    // bundle (proves the synthesized z2f import resolved correctly).
    expect(code).toContain('signupSchema');
  });

  it('rewrites against the selected named export when the schema file exports multiple schemas', async () => {
    const schemaRel = `./schemas/multi-${randomUUID().slice(0, 8)}`;
    const schemaPath = path.join(FIXTURE_ROOT, `src/${schemaRel}.ts`.replace('./', ''));
    createdFiles.push(schemaPath);
    await fs.writeFile(
      schemaPath,
      `import { z } from 'zod';\n` +
        `export const firstSchema = z.object({ first: z.string() });\n` +
        `export const secondSchema = z.object({ second: z.string().min(1) });\n`
    );
    await fs.writeFile(
      APP_PATH,
      `import { ZodForm } from '@zod-to-form/react';\n` +
        `import { secondSchema } from '${schemaRel}';\n` +
        `export function App(): unknown {\n` +
        `  return <ZodForm schema={secondSchema} onSubmit={(d: unknown) => console.log(d)} />;\n` +
        `}\n`
    );

    const { output } = await runBuild({ generate: true });
    const code = joinChunks(output);

    expect(code).not.toMatch(/createElement\(\s*ZodForm\b/);
    expect(code).toMatch(/(function|const)\s+Form\b/);
    expect(code).toContain('secondSchema');
    expect(code).toContain('"second"');
  });

  it('leaves <ZodForm> alone when rewrite is NOT enabled', async () => {
    const { output } = await runBuild({ generate: false });
    const code = joinChunks(output);
    // Without rewrite, no synthesized identifier is added and no
    // generated `function Form` body appears in the bundle.
    expect(code).not.toContain('_z2fGeneratedForm_');
  });

  it('emits a build-end summary at info level', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      await runBuild({ generate: true, logLevel: 'info' });
      const summaryLines = infoSpy.mock.calls
        .map((call) => String(call[0] ?? ''))
        .filter((s) => s.includes('Generate mode processed'));
      expect(summaryLines.length).toBeGreaterThan(0);
      expect(summaryLines[0]).toMatch(/processed\s+\d+\s+files,\s+rewrote\s+\d+\s+call sites/);
    } finally {
      infoSpy.mockRestore();
    }
  });

  it('does not emit a summary when rewrite is disabled', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      await runBuild({ generate: false, logLevel: 'info' });
      const summaryLines = infoSpy.mock.calls
        .map((call) => String(call[0] ?? ''))
        .filter((s) => s.includes('Generate mode processed'));
      expect(summaryLines.length).toBe(0);
    } finally {
      infoSpy.mockRestore();
    }
  });
});

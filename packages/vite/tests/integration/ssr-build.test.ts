import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { build, type Rollup } from 'vite';
import { z2fVite } from '../../src/index.js';

/**
 * Integration: SSR build parity (FR-017 / finding H2).
 *
 * Builds the query-minimal fixture twice — once as a normal client
 * bundle and once as `vite build --ssr` — and asserts both bundles
 * contain the same generated component declaration. We can't easily
 * `renderToString` here without bringing react+react-dom into the
 * fixture, so we use the strict-equality "code shape" assertion: the
 * generated `function GeneratedForm` body must appear identically in
 * both outputs (modulo Rollup's wrapper differences).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/query-minimal');
const SCHEMAS_DIR = path.join(FIXTURE_ROOT, 'src/schemas');

let createdFiles: string[] = [];

const SCHEMA_SOURCE = `import { z } from 'zod';
export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});
`;

async function writeUniqueSchema(): Promise<string> {
  const name = `ssr-${randomUUID().slice(0, 8)}.ts`;
  const full = path.join(SCHEMAS_DIR, name);
  await fs.writeFile(full, SCHEMA_SOURCE);
  createdFiles.push(full);
  return `./schemas/${name}`;
}

async function runBuild(entryRel: string, options: { ssr: boolean }): Promise<Rollup.RollupOutput> {
  const entryFile = path.join(FIXTURE_ROOT, `src/ssr-entry-${randomUUID().slice(0, 8)}.ts`);
  createdFiles.push(entryFile);
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
      ssr: options.ssr,
      rollupOptions: {
        external: (id): boolean =>
          !(id.includes('?z2f') || id.startsWith('.') || id.startsWith('/'))
      }
    }
  });

  if (Array.isArray(result)) return result[0]!;
  if ('output' in result) return result;
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

function extractComponentBody(code: string): string {
  // Pull out the `function GeneratedForm(...) { ... }` block. Both client
  // and SSR bundles should contain the same body — the surrounding
  // wrapper (Rollup namespace export shim) may differ.
  const match = code.match(/function\s+GeneratedForm\s*\([\s\S]*?\n\}/);
  if (match === null) {
    throw new Error(`could not locate GeneratedForm function in:\n${code}`);
  }
  return match[0];
}

describe('SSR build parity', () => {
  it('client and SSR builds emit the same generated component body', async () => {
    const rel = await writeUniqueSchema();

    const clientOutput = await runBuild(rel, { ssr: false });
    const ssrOutput = await runBuild(rel, { ssr: true });

    const clientChunks = clientOutput.output.filter(
      (c): c is Rollup.OutputChunk => c.type === 'chunk'
    );
    const ssrChunks = ssrOutput.output.filter((c): c is Rollup.OutputChunk => c.type === 'chunk');

    const clientCode = clientChunks.map((c) => c.code).join('\n');
    const ssrCode = ssrChunks.map((c) => c.code).join('\n');

    const clientBody = extractComponentBody(clientCode);
    const ssrBody = extractComponentBody(ssrCode);

    expect(clientBody).toBe(ssrBody);
  });
});

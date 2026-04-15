import { afterEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { build, createServer, type Rollup, type ViteDevServer } from 'vite';
import { z2fVite } from '../../src/index.js';

/**
 * Integration: CLI / plugin coexistence (FR-007, FR-019, finding M1).
 *
 * A project may have both:
 *   1. CLI-emitted `*.generated.tsx` files committed to source control
 *      from earlier `zod-to-form generate` runs.
 *   2. New schemas accessed via `?z2f` imports through the Vite plugin.
 *
 * The plugin MUST never touch the CLI-emitted files: not in dev, not in
 * build, not in HMR. This test asserts byte-equality of the legacy file
 * across a full plugin lifecycle, AND verifies the plugin-handled
 * import works in parallel.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/cli-coexist');
const LEGACY_FILE = path.join(FIXTURE_ROOT, 'src/generated/Legacy.generated.tsx');

let activeServer: ViteDevServer | null = null;
let originalLegacyBytes: Buffer;
let originalLegacyMtime: number;

async function snapshotLegacy(): Promise<void> {
  originalLegacyBytes = await fs.readFile(LEGACY_FILE);
  const stat = await fs.stat(LEGACY_FILE);
  originalLegacyMtime = stat.mtimeMs;
}

async function assertLegacyUntouched(): Promise<void> {
  const after = await fs.readFile(LEGACY_FILE);
  expect(after.equals(originalLegacyBytes), 'legacy CLI file content was modified').toBe(true);
  expect(after.toString('utf8')).toContain('Z2F_CLI_SENTINEL_DO_NOT_TOUCH_v1');
  // mtime should also be unchanged — the plugin should never even touch
  // the file's metadata.
  const stat = await fs.stat(LEGACY_FILE);
  expect(stat.mtimeMs, 'legacy file mtime changed').toBe(originalLegacyMtime);
}

async function startDevServer(): Promise<ViteDevServer> {
  const server = await createServer({
    root: FIXTURE_ROOT,
    configFile: false,
    plugins: [
      z2fVite({
        configOverride: {
          componentName: 'ActiveForm',
          mode: 'submit',
          ui: 'html'
        },
        logLevel: 'silent'
      })
    ],
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true }
  });
  activeServer = server;
  return server;
}

async function loadZ2F(server: ViteDevServer, schemaRel: string): Promise<string> {
  const importer = path.join(FIXTURE_ROOT, 'src/main.tsx');
  const resolved = await server.pluginContainer.resolveId(`${schemaRel}?z2f`, importer);
  if (resolved === null || resolved === undefined) {
    throw new Error(`failed to resolve ${schemaRel}?z2f`);
  }
  const loaded = await server.pluginContainer.load(resolved.id);
  if (loaded === null || loaded === undefined) throw new Error('load returned null');
  return typeof loaded === 'string' ? loaded : loaded.code;
}

afterEach(async () => {
  if (activeServer !== null) {
    await activeServer.close();
    activeServer = null;
  }
});

describe('CLI / plugin coexistence', () => {
  it('dev mode plugin run leaves the legacy CLI-emitted file untouched', async () => {
    await snapshotLegacy();
    const server = await startDevServer();

    // Compile the plugin-handled schema.
    const code = await loadZ2F(server, './schemas/active.ts');
    expect(code).toContain('ActiveForm');
    expect(code).toContain('activeSchema');

    await assertLegacyUntouched();
  });

  it('build mode plugin run leaves the legacy CLI-emitted file untouched', async () => {
    await snapshotLegacy();

    // Use a unique entry file so parallel test runs don't collide.
    const entryFile = path.join(FIXTURE_ROOT, `src/build-entry-${Date.now()}.ts`);
    await fs.writeFile(
      entryFile,
      `import { ActiveForm } from './schemas/active.ts?z2f';\nexport { ActiveForm };\n`
    );
    try {
      const result = await build({
        root: FIXTURE_ROOT,
        configFile: false,
        plugins: [
          z2fVite({
            configOverride: {
              componentName: 'ActiveForm',
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
          minify: false,
          rollupOptions: {
            external: (id): boolean =>
              !(id.includes('?z2f') || id.startsWith('.') || id.startsWith('/'))
          }
        }
      });
      const output = Array.isArray(result) ? result[0]! : (result as Rollup.RollupOutput);
      const chunks = output.output.filter((c): c is Rollup.OutputChunk => c.type === 'chunk');
      const allCode = chunks.map((c) => c.code).join('\n');
      expect(allCode).toMatch(/function\s+ActiveForm\b|const\s+ActiveForm\s*[:=]/);
    } finally {
      await fs.rm(entryFile, { force: true });
    }

    await assertLegacyUntouched();
  });

  it('HMR for the plugin-handled schema does not touch the legacy file', async () => {
    await snapshotLegacy();
    const server = await startDevServer();
    await loadZ2F(server, './schemas/active.ts');

    // Trigger an HMR event for the plugin-handled schema.
    const activePath = path.join(FIXTURE_ROOT, 'src/schemas/active.ts');
    server.watcher.emit('change', activePath);
    await new Promise((r) => setImmediate(r));

    // Re-load and verify the plugin still works.
    const code = await loadZ2F(server, './schemas/active.ts');
    expect(code).toContain('ActiveForm');

    await assertLegacyUntouched();
  });
});

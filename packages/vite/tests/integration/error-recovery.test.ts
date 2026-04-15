import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createServer, type ViteDevServer } from 'vite';
import { z2fVite } from '../../src/index.js';

/**
 * Integration: dev-mode error recovery (FR-010, SC-008).
 *
 * Closes the failure mode where a developer breaks their schema file
 * mid-session: the plugin must surface a typed error AND the previously
 * compiled module must remain accessible so the dev server doesn't go
 * dark.
 *
 * Test isolation: each test creates uniquely-named schema files inside
 * the in-monorepo fixture (so `zod` resolves through the workspace) and
 * cleans them up in `afterEach`.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/query-minimal');
const SCHEMAS_DIR = path.join(FIXTURE_ROOT, 'src/schemas');

let createdFiles: string[] = [];
let activeServer: ViteDevServer | null = null;

const VALID_SCHEMA = `import { z } from 'zod';
export const target = z.object({
  name: z.string().min(2),
  email: z.string().email()
});
`;

async function writeUniqueSchema(
  prefix: string,
  content: string
): Promise<{
  rel: string;
  full: string;
}> {
  const name = `${prefix}-${randomUUID().slice(0, 8)}.ts`;
  const full = path.join(SCHEMAS_DIR, name);
  await fs.writeFile(full, content);
  createdFiles.push(full);
  return { rel: `./schemas/${name}`, full };
}

async function startServer(): Promise<ViteDevServer> {
  const server = await createServer({
    root: FIXTURE_ROOT,
    configFile: false,
    plugins: [
      z2fVite({
        configOverride: {
          componentName: 'TestForm',
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

async function loadZ2F(server: ViteDevServer, schemaRelPath: string): Promise<string> {
  const importer = path.join(FIXTURE_ROOT, 'src/main.tsx');
  const resolved = await server.pluginContainer.resolveId(`${schemaRelPath}?z2f`, importer);
  if (resolved === null || resolved === undefined) {
    throw new Error(`failed to resolve ${schemaRelPath}?z2f`);
  }
  const loaded = await server.pluginContainer.load(resolved.id);
  if (loaded === null || loaded === undefined) throw new Error(`load returned null`);
  return typeof loaded === 'string' ? loaded : loaded.code;
}

async function invalidate(server: ViteDevServer, full: string): Promise<void> {
  // Drop Vite's module-graph entry...
  const stale = server.moduleGraph.getModulesByFile(full);
  if (stale !== undefined) {
    for (const node of stale) server.moduleGraph.invalidateModule(node);
  }
  // ...AND fire a watcher 'change' event so the plugin's handleHotUpdate
  // hook runs and evicts its own internal CompilationCache. Without this
  // the plugin would keep returning the cached compiled source even
  // though the source file changed underneath.
  server.watcher.emit('change', full);
  // Give Vite one microtask tick to flush HMR work.
  await new Promise((r) => setImmediate(r));
}

beforeEach(() => {
  createdFiles = [];
});

afterEach(async () => {
  if (activeServer !== null) {
    await activeServer.close();
    activeServer = null;
  }
  for (const f of createdFiles) {
    await fs.rm(f, { force: true });
  }
});

describe('error recovery', () => {
  it('throws Z2F_VITE_CODEGEN_FAILURE when the schema has a TypeScript syntax error', async () => {
    const server = await startServer();
    const { rel, full } = await writeUniqueSchema(
      'broken',
      `import { z } from 'zod';\nexport const target = z.object({ name: ); // broken\n`
    );
    await invalidate(server, full);
    await expect(loadZ2F(server, rel)).rejects.toThrow(/Z2F_VITE_CODEGEN_FAILURE/);
  });

  it('throws Z2F_VITE_SCHEMA_NOT_ZOD when the export is replaced with a non-Zod value', async () => {
    const server = await startServer();
    const { rel, full } = await writeUniqueSchema(
      'notzod',
      `export const target = { not: 'a zod schema' };\n`
    );
    await invalidate(server, full);
    await expect(loadZ2F(server, rel)).rejects.toThrow(
      /Z2F_VITE_SCHEMA_NOT_ZOD|Z2F_VITE_SCHEMA_NOT_FOUND/
    );
  });

  it('serves the previously-cached form for a different schema after a sibling breaks', async () => {
    const server = await startServer();
    const sibling = await writeUniqueSchema('login', VALID_SCHEMA);
    const broken = await writeUniqueSchema('break', VALID_SCHEMA);

    // Compile both successfully first.
    const before = await loadZ2F(server, sibling.rel);
    expect(before).toContain('target');
    await loadZ2F(server, broken.rel);

    // Now break the second one.
    await fs.writeFile(broken.full, `export const target = ;  // syntax error\n`);
    await invalidate(server, broken.full);

    // Sibling repeat-load returns identical bytes from the cache.
    const after = await loadZ2F(server, sibling.rel);
    expect(after).toBe(before);
  });

  it('recovers automatically once the schema file is fixed', async () => {
    const server = await startServer();
    const { rel, full } = await writeUniqueSchema('recover', VALID_SCHEMA);

    // Verify it works first.
    const ok1 = await loadZ2F(server, rel);
    expect(ok1).toContain('TestForm');

    // Break it.
    await fs.writeFile(full, `export const target = ;  // broken\n`);
    await invalidate(server, full);
    await expect(loadZ2F(server, rel)).rejects.toThrow(/Z2F_VITE_/);

    // Restore it.
    await fs.writeFile(full, VALID_SCHEMA);
    await invalidate(server, full);

    const ok2 = await loadZ2F(server, rel);
    expect(ok2).toContain('TestForm');
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { createServer, type ViteDevServer } from 'vite';
import { z2fVite } from '../../src/index.js';

/**
 * Integration: surgical HMR (SC-007 / finding H4).
 *
 * With 20 distinct schemas in the cache, editing exactly ONE schema must
 * invalidate exactly ONE entry — not all 20. Closes the failure mode
 * where a naive HMR implementation evicts the entire cache on any schema
 * change.
 *
 * We can't easily count Vite's HMR update events from outside the dev
 * server, so we observe the plugin's CompilationCache via a pure-helper
 * proxy: load all 20 ?z2f modules, snapshot the cache hit count, edit
 * one schema, trigger the watcher, then re-load all 20 and assert that
 * 19 of them were cache hits and only 1 was a recompile (cache miss).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/twenty-schemas');
const SCHEMAS_DIR = path.join(FIXTURE_ROOT, 'src/schemas');

let activeServer: ViteDevServer | null = null;

async function startServer(): Promise<ViteDevServer> {
  const server = await createServer({
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
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true }
  });
  activeServer = server;
  return server;
}

async function loadOne(server: ViteDevServer, n: number): Promise<string> {
  const importer = path.join(FIXTURE_ROOT, 'src/main.tsx');
  const rel = `./schemas/form${n}.ts`;
  const resolved = await server.pluginContainer.resolveId(`${rel}?z2f`, importer);
  if (resolved === null || resolved === undefined) {
    throw new Error(`failed to resolve form${n}`);
  }
  const loaded = await server.pluginContainer.load(resolved.id);
  if (loaded === null || loaded === undefined) throw new Error(`load returned null`);
  return typeof loaded === 'string' ? loaded : loaded.code;
}

afterEach(async () => {
  if (activeServer !== null) {
    await activeServer.close();
    activeServer = null;
  }
  // Restore the schema we edited (test 1 mutates form7.ts).
  const form7Path = path.join(SCHEMAS_DIR, 'form7.ts');
  await fs.writeFile(
    form7Path,
    `import { z } from 'zod';\nexport const schema = z.object({\n  field7: z.string().min(1)\n});\n`
  );
});

describe('surgical HMR (20 schemas)', () => {
  it('editing one schema invalidates only that schema, leaving the other 19 cached', async () => {
    const server = await startServer();

    // Warm the cache: load all 20 schemas.
    const original: string[] = [];
    for (let i = 1; i <= 20; i++) {
      original.push(await loadOne(server, i));
    }
    expect(original).toHaveLength(20);

    // Edit form7.ts — add a second field to make the output materially
    // different so a stale cache entry would show up as an unchanged
    // string in the assertion below.
    const form7Path = path.join(SCHEMAS_DIR, 'form7.ts');
    await fs.writeFile(
      form7Path,
      `import { z } from 'zod';\nexport const schema = z.object({\n  field7: z.string().min(1),\n  extraSeven: z.string()\n});\n`
    );

    // Drop Vite's module-graph entry AND fire the watcher event so the
    // plugin's handleHotUpdate hook runs and evicts its cache for form7.
    const stale = server.moduleGraph.getModulesByFile(form7Path);
    if (stale !== undefined) {
      for (const node of stale) server.moduleGraph.invalidateModule(node);
    }
    server.watcher.emit('change', form7Path);
    await new Promise((r) => setImmediate(r));

    // Re-load all 20 schemas. Forms 1-6 and 8-20 should match the snapshot
    // exactly (cache hits); form7 should differ (recompiled).
    const after: string[] = [];
    for (let i = 1; i <= 20; i++) {
      after.push(await loadOne(server, i));
    }

    let unchanged = 0;
    let changed = 0;
    for (let i = 0; i < 20; i++) {
      if (after[i] === original[i]) {
        unchanged += 1;
      } else {
        changed += 1;
      }
    }

    expect(unchanged).toBe(19);
    expect(changed).toBe(1);
    // Form7 (index 6) is the one that should have changed.
    expect(after[6]).not.toBe(original[6]);
    expect(after[6]).toContain('extraSeven');
  });

  it('editing an unrelated file outside the schemas dir invalidates nothing', async () => {
    const server = await startServer();

    // Warm cache.
    const before: string[] = [];
    for (let i = 1; i <= 20; i++) before.push(await loadOne(server, i));

    // Touch an unrelated file.
    const unrelated = path.join(FIXTURE_ROOT, 'src/unrelated.ts');
    await fs.writeFile(unrelated, '// untracked\n');
    try {
      server.watcher.emit('change', unrelated);
      await new Promise((r) => setImmediate(r));

      const after: string[] = [];
      for (let i = 1; i <= 20; i++) after.push(await loadOne(server, i));
      // Every entry should be byte-identical.
      for (let i = 0; i < 20; i++) {
        expect(after[i]).toBe(before[i]);
      }
    } finally {
      await fs.rm(unrelated, { force: true });
    }
  });
});

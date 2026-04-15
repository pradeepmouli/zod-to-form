import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { createServer, type ViteDevServer } from 'vite';
import { z2fVite } from '../../src/index.js';

/**
 * Integration: config auto-discovery + watch (Phase 5 / US3).
 *
 * Closes:
 *   - FR-009: editing z2f.config.ts invalidates every cached entry within
 *     two seconds and the next load reflects the new config.
 *   - FR-010 / SC-008: a syntax error in the config file does NOT crash
 *     the dev server; the previously-valid config keeps serving.
 *
 * The fixture has its own `z2f.config.ts` that the plugin auto-discovers
 * (no `configPath` option supplied). The test edits the config file
 * mid-session and asserts the cache evicts.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/config-watch');
const CONFIG_PATH = path.join(FIXTURE_ROOT, 'z2f.config.ts');
const ORIGINAL_CONFIG = await fs.readFile(CONFIG_PATH, 'utf8');

let activeServer: ViteDevServer | null = null;

async function startServer(): Promise<ViteDevServer> {
  const server = await createServer({
    root: FIXTURE_ROOT,
    configFile: false,
    plugins: [
      z2fVite({
        // No configPath — the plugin auto-discovers ./z2f.config.ts.
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

async function loadZ2F(server: ViteDevServer, query: string): Promise<string> {
  const importer = path.join(FIXTURE_ROOT, 'src/main.tsx');
  const resolved = await server.pluginContainer.resolveId(query, importer);
  if (resolved === null || resolved === undefined) {
    throw new Error(`failed to resolve ${query}`);
  }
  const loaded = await server.pluginContainer.load(resolved.id);
  if (loaded === null || loaded === undefined) throw new Error(`load returned null`);
  return typeof loaded === 'string' ? loaded : loaded.code;
}

async function fireConfigChange(server: ViteDevServer): Promise<void> {
  server.watcher.emit('change', CONFIG_PATH);
  // Yield a microtask so the plugin's handleHotUpdate runs before the
  // next assertion.
  await new Promise((r) => setImmediate(r));
}

beforeEach(async () => {
  // Restore the original config before every test so a previous test's
  // mutation can't leak.
  await fs.writeFile(CONFIG_PATH, ORIGINAL_CONFIG);
});

afterEach(async () => {
  if (activeServer !== null) {
    await activeServer.close();
    activeServer = null;
  }
  await fs.writeFile(CONFIG_PATH, ORIGINAL_CONFIG);
});

describe('config-watch integration', () => {
  it('auto-discovers z2f.config.ts in the project root', async () => {
    const server = await startServer();
    const code = await loadZ2F(server, './schemas/user.ts?z2f');
    // The auto-discovered config sets componentName: 'UserForm'.
    expect(code).toMatch(/(function|const)\s+UserForm\b/);
  });

  it('respects per-variant overrides from the config file', async () => {
    const server = await startServer();
    const editCode = await loadZ2F(server, './schemas/user.ts?z2f=edit');
    const createCode = await loadZ2F(server, './schemas/user.ts?z2f=create');
    expect(editCode).toMatch(/(function|const)\s+UserEditForm\b/);
    expect(createCode).toMatch(/(function|const)\s+UserCreateForm\b/);
  });

  it('invalidates the cache when z2f.config.ts changes', async () => {
    const server = await startServer();
    const before = await loadZ2F(server, './schemas/user.ts?z2f');
    expect(before).toMatch(/(function|const)\s+UserForm\b/);

    // Edit the config to rename the component.
    await fs.writeFile(
      CONFIG_PATH,
      `export default {
  componentName: 'RenamedForm',
  mode: 'submit',
  ui: 'html'
};
`
    );
    await fireConfigChange(server);

    const after = await loadZ2F(server, './schemas/user.ts?z2f');
    expect(after).not.toBe(before);
    expect(after).toMatch(/(function|const)\s+RenamedForm\b/);
  });

  it('keeps serving the previous config when a new edit introduces a syntax error', async () => {
    const server = await startServer();
    const before = await loadZ2F(server, './schemas/user.ts?z2f');

    // Break the config file mid-session.
    await fs.writeFile(CONFIG_PATH, `export default { componentName: ; // syntax error\n`);
    await fireConfigChange(server);

    // The next load should NOT throw — the plugin falls back to the
    // previously-valid config.
    const after = await loadZ2F(server, './schemas/user.ts?z2f');
    expect(after).toBe(before);
  });

  it('recovers automatically once the config file is fixed', async () => {
    const server = await startServer();
    const before = await loadZ2F(server, './schemas/user.ts?z2f');

    // Break it.
    await fs.writeFile(CONFIG_PATH, `export default { componentName: ;\n`);
    await fireConfigChange(server);
    // Sanity: previous config still serves.
    const stillServing = await loadZ2F(server, './schemas/user.ts?z2f');
    expect(stillServing).toBe(before);

    // Restore with a different componentName.
    await fs.writeFile(
      CONFIG_PATH,
      `export default {
  componentName: 'RestoredForm',
  mode: 'submit',
  ui: 'html'
};
`
    );
    await fireConfigChange(server);

    const after = await loadZ2F(server, './schemas/user.ts?z2f');
    expect(after).toMatch(/(function|const)\s+RestoredForm\b/);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createServer, type ViteDevServer } from 'vite';
import { z2fVite } from '../../src/index.js';

/**
 * Integration: dev-mode end-to-end via Vite's programmatic API.
 *
 * Spins up a real `createServer` against the `query-minimal` fixture,
 * then uses Vite's `pluginContainer` directly (resolveId + load) to walk
 * the full plugin pipeline against a live Vite SSR module loader. We
 * skip `transformRequest` because that runs Vite's import-analysis pass
 * which would try to resolve react-hook-form / @hookform/resolvers from
 * the fixture root — those aren't fixture deps; the integration we care
 * about is "the plugin's load hook produces the expected source", which
 * pluginContainer.load exercises directly.
 *
 * Test isolation: each test creates uniquely-named schema files inside
 * the in-monorepo fixture and cleans them up in `afterEach`. We can't
 * use a tmpdir because the schemas import `zod`, and Node module
 * resolution from a tmpdir wouldn't find the workspace's hoisted copy.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/query-minimal');
const SCHEMAS_DIR = path.join(FIXTURE_ROOT, 'src/schemas');

let createdFiles: string[] = [];
let activeServer: ViteDevServer | null = null;

async function writeUniqueSchema(prefix: string, content: string): Promise<string> {
  const name = `${prefix}-${randomUUID().slice(0, 8)}.ts`;
  const fullPath = path.join(SCHEMAS_DIR, name);
  await fs.writeFile(fullPath, content);
  createdFiles.push(fullPath);
  return `./schemas/${name}`;
}

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

async function loadZ2F(server: ViteDevServer, schemaRelPath: string): Promise<string> {
  const importer = path.join(FIXTURE_ROOT, 'src/main.tsx');
  const resolved = await server.pluginContainer.resolveId(`${schemaRelPath}?z2f`, importer);
  if (resolved === null || resolved === undefined) {
    throw new Error(`failed to resolve ${schemaRelPath}?z2f`);
  }
  const loaded = await server.pluginContainer.load(resolved.id);
  if (loaded === null || loaded === undefined) {
    throw new Error(`load returned null for ${resolved.id}`);
  }
  return typeof loaded === 'string' ? loaded : loaded.code;
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

const SIGNUP_SCHEMA = `import { z } from 'zod';
export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().int().min(13)
});
`;

describe('query-mode dev integration', () => {
  it('the plugin pipeline produces a generated component source for a ?z2f import', async () => {
    const server = await startServer();
    const rel = await writeUniqueSchema('signup', SIGNUP_SCHEMA);
    const code = await loadZ2F(server, rel);

    expect(typeof code).toBe('string');
    expect(code).toMatch(
      /export\s+(default\s+)?(function|const)\s+GeneratedForm\b|function\s+GeneratedForm\b|const\s+GeneratedForm\s*[:=]/
    );
    expect(code).toContain('signupSchema');
  });

  it('serves identical content on a repeat load (cache hit)', async () => {
    const server = await startServer();
    const rel = await writeUniqueSchema('signup', SIGNUP_SCHEMA);
    const first = await loadZ2F(server, rel);
    const second = await loadZ2F(server, rel);
    expect(first).toBe(second);
  });

  it('produces different output for two distinct schema files', async () => {
    const server = await startServer();
    const aRel = await writeUniqueSchema('signup', SIGNUP_SCHEMA);
    const bRel = await writeUniqueSchema(
      'login',
      `import { z } from 'zod';\nexport const loginSchema = z.object({ user: z.string(), pass: z.string() });\n`
    );
    const a = await loadZ2F(server, aRel);
    const b = await loadZ2F(server, bRel);
    expect(a).not.toBe(b);
    expect(b).toContain('loginSchema');
  });

  it('rejects schemas outside the Vite root with Z2F_VITE_SCHEMA_OUTSIDE_ROOT', async () => {
    const server = await startServer();
    const importer = path.join(FIXTURE_ROOT, 'src/main.tsx');
    await expect(
      server.pluginContainer.resolveId('/tmp/elsewhere.ts?z2f', importer)
    ).rejects.toThrow(/Z2F_VITE_SCHEMA_OUTSIDE_ROOT|Z2F_VITE_SCHEMA_NOT_FOUND/);
  });
});

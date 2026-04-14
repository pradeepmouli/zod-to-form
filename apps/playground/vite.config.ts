import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

function shadcnRegistryPlugin(): Plugin {
  let registryConfigCache: Record<string, string> | null = null;
  let registryConfigTimestamp = 0;
  const CACHE_TTL = 5 * 60 * 1000;

  async function getRegistryConfig(): Promise<Record<string, string>> {
    const now = Date.now();
    if (registryConfigCache && now - registryConfigTimestamp < CACHE_TTL) {
      return registryConfigCache;
    }
    const { getRegistries } = await import('shadcn/registry');
    const regs = await getRegistries({ useCache: true });
    const config: Record<string, string> = {};
    for (const r of regs) {
      config[r.name] = r.url;
    }
    registryConfigCache = config;
    registryConfigTimestamp = now;
    return config;
  }

  function sendJson(res: import('http').ServerResponse, data: unknown, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  function sendError(res: import('http').ServerResponse, message: string, status = 500) {
    sendJson(res, { error: message }, status);
  }

  const MAX_BODY_SIZE = 64 * 1024;

  function readBody(req: import('http').IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;
      req.on('data', (c: Buffer) => {
        size += c.length;
        if (size > MAX_BODY_SIZE) {
          req.destroy();
          reject(new Error('Request body too large'));
          return;
        }
        chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString()));
      req.on('error', reject);
    });
  }

  return {
    name: 'shadcn-registry',
    configureServer(server) {
      server.middlewares.use('/api/shadcn/registries', async (_req, res) => {
        try {
          const { getRegistries } = await import('shadcn/registry');
          const regs = await getRegistries({ useCache: true });
          sendJson(res, regs);
        } catch (err: unknown) {
          sendError(res, err instanceof Error ? err.message : 'Failed to fetch registries');
        }
      });

      server.middlewares.use('/api/shadcn/search', async (req, res) => {
        try {
          const url = new URL(req.url ?? '', 'http://localhost');
          const registry = url.searchParams.get('registry');
          const query = url.searchParams.get('q') ?? '';
          const limit = Math.min(
            Math.max(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 1),
            100
          );
          const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0);

          if (!registry) {
            sendError(res, "Missing 'registry' param", 400);
            return;
          }

          const registries = await getRegistryConfig();
          const { searchRegistries } = await import('shadcn/registry');
          const result = await searchRegistries([registry], {
            query,
            limit,
            offset,
            config: { registries }
          });
          sendJson(res, result);
        } catch (err: unknown) {
          sendError(res, err instanceof Error ? err.message : 'Search failed');
        }
      });

      server.middlewares.use('/api/shadcn/resolve', async (req, res) => {
        if (req.method !== 'POST') {
          sendError(res, 'POST required', 405);
          return;
        }
        try {
          const body = JSON.parse(await readBody(req));
          const items: string[] = body.items;
          if (!items || !Array.isArray(items) || items.length === 0) {
            sendError(res, "Missing 'items' array", 400);
            return;
          }
          if (items.length > 20) {
            sendError(res, 'Too many items (max 20)', 400);
            return;
          }

          const registries = await getRegistryConfig();
          const { resolveRegistryItems } = await import('shadcn/registry');
          const result = await resolveRegistryItems(items, {
            config: { style: 'new-york', registries }
          });

          sendJson(res, {
            files: (result.files ?? []).map((f) => ({
              path: f.path,
              type: f.type,
              content: f.content ?? null
            })),
            dependencies: result.dependencies ?? [],
            devDependencies: result.devDependencies ?? [],
            cssVars: result.cssVars ?? {}
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Resolution failed';
          const status = (err as { code?: string })?.code === 'NOT_FOUND' ? 404 : 500;
          sendError(res, message, status);
        }
      });
    }
  };
}

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

// When deployed under zod.toform.dev/play/ via Cloudflare Pages, assets
// must resolve from the /play/ subpath. CF_PAGES=1 is set automatically by
// Cloudflare; PLAYGROUND_BASE can override for other deploy targets.
const base = process.env.PLAYGROUND_BASE ?? (process.env.CF_PAGES === '1' ? '/play/' : '/');

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [react(), tailwindcss(), shadcnRegistryPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true
  },
  optimizeDeps: {
    include: [
      '@zod-to-form/core',
      '@zod-to-form/react',
      'zod',
      'react-hook-form',
      '@hookform/resolvers/zod'
    ]
  },
  worker: {
    format: 'es'
  },
  build: {
    target: 'es2022'
  }
});

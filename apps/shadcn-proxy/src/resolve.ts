/**
 * POST /api/shadcn/resolve
 * Body: { items: string[] }  // e.g. ["button", "@shadcn/checkbox", "@foo/bar"]
 *
 * Fetches each registry item, recursively resolves registryDependencies
 * (depth-bounded + visited-set), aggregates files/deps/cssVars.
 */

import {
  SHADCN_REGISTRY_NAME,
  buildItemUrl,
  errorResponse,
  isAllowedUrl,
  isValidRegistryName,
  jsonResponse,
  loadRegistries,
  type CommunityRegistry,
  type RegistryItem,
  type RegistryItemFile
} from './_shared';
import { CORS_HEADERS } from './_shared';

const MAX_ITEMS = 20;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_REGISTRY_FETCHES = 100;
const MAX_DEPTH = 5;

interface ParsedRef {
  registry: string;
  name: string;
}

function parseItemRef(ref: string): ParsedRef | null {
  const trimmed = ref.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('@')) {
    const slash = trimmed.indexOf('/');
    if (slash < 0) return null;
    const registry = trimmed.slice(0, slash);
    const name = trimmed.slice(slash + 1);
    if (!registry || !name) return null;
    if (!isValidRegistryName(registry)) return null;
    return { registry, name };
  }
  return { registry: SHADCN_REGISTRY_NAME, name: trimmed };
}

export const handleResolveOptions = (): Response =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const handleResolve = async (request: Request): Promise<Response> => {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return errorResponse('Request body too large', 413);
    }

    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return errorResponse('Request body too large', 413);
    }

    let body: { items?: unknown };
    try {
      body = JSON.parse(text);
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const items = body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse("Missing 'items' array", 400);
    }
    if (items.length > MAX_ITEMS) {
      return errorResponse(`Too many items (max ${MAX_ITEMS})`, 400);
    }
    if (!items.every((x): x is string => typeof x === 'string')) {
      return errorResponse("All 'items' entries must be strings", 400);
    }

    const parsed: ParsedRef[] = [];
    for (const raw of items) {
      const ref = parseItemRef(raw);
      if (!ref) {
        return errorResponse(`Invalid item reference: ${raw}`, 400);
      }
      parsed.push(ref);
    }

    const needsCommunity = parsed.some((p) => p.registry !== SHADCN_REGISTRY_NAME);
    let registryByName: Map<string, CommunityRegistry> = new Map();
    let allowedHosts: Set<string> = new Set(['ui.shadcn.com']);
    if (needsCommunity) {
      const loaded = await loadRegistries();
      registryByName = loaded.byName;
      allowedHosts = loaded.allowedHosts;
    }

    const filesByPath = new Map<string, RegistryItemFile>();
    const dependencies = new Set<string>();
    const devDependencies = new Set<string>();
    const cssVars: Record<string, Record<string, string>> = {};
    const visited = new Set<string>();
    let fetchCount = 0;

    async function resolveOne(ref: ParsedRef, depth: number): Promise<void> {
      if (depth > MAX_DEPTH) return;
      if (fetchCount >= MAX_REGISTRY_FETCHES) return;

      const visitKey = `${ref.registry}::${ref.name}`;
      if (visited.has(visitKey)) return;
      visited.add(visitKey);

      let itemUrl: string;
      if (ref.registry === SHADCN_REGISTRY_NAME) {
        itemUrl = buildItemUrl(SHADCN_REGISTRY_NAME, ref.name);
      } else {
        const entry = registryByName.get(ref.registry);
        if (!entry) {
          throw new Error(`Unknown registry: ${ref.registry}`);
        }
        itemUrl = buildItemUrl(entry, ref.name);
      }

      if (!isAllowedUrl(itemUrl, allowedHosts)) {
        throw new Error(`Registry URL not allowed: ${itemUrl}`);
      }

      fetchCount++;
      const res = await fetch(itemUrl, {
        headers: { Accept: 'application/json' },
        cf: { cacheTtl: 300, cacheEverything: true }
      });
      if (res.status === 404) {
        const err = new Error(`Item not found: ${ref.registry}/${ref.name}`);
        (err as Error & { code?: string }).code = 'NOT_FOUND';
        throw err;
      }
      if (!res.ok) {
        throw new Error(`Upstream error for ${ref.registry}/${ref.name}: HTTP ${res.status}`);
      }

      const item = (await res.json()) as RegistryItem;

      if (Array.isArray(item.files)) {
        for (const f of item.files) {
          if (!f || typeof f.path !== 'string') continue;
          if (filesByPath.has(f.path)) continue;
          filesByPath.set(f.path, {
            path: f.path,
            type: typeof f.type === 'string' ? f.type : 'registry:ui',
            content: typeof f.content === 'string' ? f.content : null
          });
        }
      }

      for (const d of item.dependencies ?? []) {
        if (typeof d === 'string' && d) dependencies.add(d);
      }
      for (const d of item.devDependencies ?? []) {
        if (typeof d === 'string' && d) devDependencies.add(d);
      }
      if (item.cssVars && typeof item.cssVars === 'object') {
        for (const [scope, vars] of Object.entries(item.cssVars)) {
          if (!vars || typeof vars !== 'object') continue;
          cssVars[scope] = { ...cssVars[scope], ...vars };
        }
      }

      const deps = Array.isArray(item.registryDependencies) ? item.registryDependencies : [];
      for (const dep of deps) {
        if (typeof dep !== 'string' || !dep) continue;
        if (dep.startsWith('http://') || dep.startsWith('https://')) {
          if (!isAllowedUrl(dep, allowedHosts)) continue;
          const visitKeyUrl = `url::${dep}`;
          if (visited.has(visitKeyUrl)) continue;
          visited.add(visitKeyUrl);
          if (fetchCount >= MAX_REGISTRY_FETCHES) return;
          fetchCount++;
          const subRes = await fetch(dep, {
            headers: { Accept: 'application/json' },
            cf: { cacheTtl: 300, cacheEverything: true }
          });
          if (!subRes.ok) continue;
          const subItem = (await subRes.json()) as RegistryItem;
          for (const f of subItem.files ?? []) {
            if (!f || typeof f.path !== 'string') continue;
            if (filesByPath.has(f.path)) continue;
            filesByPath.set(f.path, {
              path: f.path,
              type: typeof f.type === 'string' ? f.type : 'registry:ui',
              content: typeof f.content === 'string' ? f.content : null
            });
          }
          for (const d of subItem.dependencies ?? []) {
            if (typeof d === 'string' && d) dependencies.add(d);
          }
          continue;
        }

        const nextRef = dep.startsWith('@')
          ? parseItemRef(dep)
          : { registry: ref.registry, name: dep };
        if (!nextRef) continue;
        await resolveOne(nextRef, depth + 1);
      }
    }

    try {
      for (const ref of parsed) {
        await resolveOne(ref, 0);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Resolution failed';
      const status = (err as { code?: string } | null)?.code === 'NOT_FOUND' ? 404 : 502;
      return errorResponse(message, status);
    }

    return jsonResponse({
      files: Array.from(filesByPath.values()).map((f) => ({
        path: f.path,
        type: f.type ?? 'registry:ui',
        content: f.content ?? null
      })),
      dependencies: Array.from(dependencies),
      devDependencies: Array.from(devDependencies),
      cssVars
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Resolution failed';
    return errorResponse(message, 500);
  }
};

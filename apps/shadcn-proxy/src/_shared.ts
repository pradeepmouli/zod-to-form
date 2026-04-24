/**
 * Shared helpers for the /api/shadcn/* Cloudflare Worker handlers.
 *
 * The playground's Vite dev middleware (apps/playground/vite.config.ts)
 * uses the Node-only `shadcn/registry` package. This Worker runs on the
 * Workers runtime, so these handlers re-implement the subset of registry
 * behavior we need using plain `fetch()`.
 *
 * No Node built-ins are allowed here — only Web/Workers APIs.
 */

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '600'
};

export const JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  ...CORS_HEADERS
};

export const REGISTRIES_URL = 'https://ui.shadcn.com/r/registries.json';

/** Official @shadcn registry — always available, uses new-york-v4 style. */
export const SHADCN_REGISTRY_NAME = '@shadcn';
export const SHADCN_STYLE = 'new-york-v4';
export const SHADCN_ITEM_URL_TEMPLATE = `https://ui.shadcn.com/r/styles/${SHADCN_STYLE}/{name}.json`;
export const SHADCN_INDEX_URL = 'https://ui.shadcn.com/r/index.json';

/** Matches community registry names like `@foo`, `@foo-bar`, `@foo.bar`.
 *  Case-sensitive — the `byName` Map lookup is case-sensitive, so accepting
 *  mixed-case here would let `@SHADCN` pass validation and then miss. */
const REGISTRY_NAME_PATTERN = /^@[a-z0-9][a-z0-9._-]{0,63}$/;

export function isValidRegistryName(name: string): boolean {
  return REGISTRY_NAME_PATTERN.test(name);
}

/** Returns true iff `url` is https and its hostname is in `allowedHosts`.
 *  The allowlist is built by `loadRegistries()` from registries.json plus
 *  the hardcoded `ui.shadcn.com`. */
export function isAllowedUrl(url: string, allowedHosts: Set<string>): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    return allowedHosts.has(u.hostname);
  } catch {
    return false;
  }
}

export interface CommunityRegistry {
  name: string;
  homepage?: string;
  url: string; // e.g. https://site/r/{name}.json
  description?: string;
}

export interface RegistryIndexItem {
  name: string;
  type?: string;
  description?: string;
  [k: string]: unknown;
}

export interface SearchResultItem {
  registry: string;
  name: string;
  addCommandArgument: string;
  type?: string;
  description?: string;
}

export interface RegistryItemFile {
  path: string;
  type?: string;
  content?: string | null;
  target?: string;
}

export interface RegistryItem {
  name: string;
  type?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryItemFile[];
  cssVars?: Record<string, Record<string, string>>;
  [k: string]: unknown;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

/** Load registries.json, returning the parsed list plus a hostname allowlist. */
export async function loadRegistries(): Promise<{
  registries: CommunityRegistry[];
  byName: Map<string, CommunityRegistry>;
  allowedHosts: Set<string>;
}> {
  const res = await fetch(REGISTRIES_URL, {
    headers: { Accept: 'application/json' },
    // CF edge cache the upstream for 5 min.
    cf: { cacheTtl: 300, cacheEverything: true } as unknown as RequestInitCfProperties
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch registries.json: HTTP ${res.status}`);
  }
  const data = (await res.json()) as CommunityRegistry[];
  const byName = new Map<string, CommunityRegistry>();
  const allowedHosts = new Set<string>(['ui.shadcn.com']);
  for (const r of data) {
    // Filter malformed entries so a bad descriptor can't crash the loop.
    if (!r || typeof r.name !== 'string' || typeof r.url !== 'string') continue;
    byName.set(r.name, r);
    try {
      allowedHosts.add(new URL(r.url.replace('{name}', 'placeholder')).hostname);
    } catch {
      // ignore malformed registry URLs
    }
  }
  return { registries: data, byName, allowedHosts };
}

/**
 * Build the item URL for a given registry + item name.
 * - `@shadcn` → hardcoded new-york-v4 style path
 * - community → template from registries.json (`{name}` substitution)
 */
export function buildItemUrl(
  registry: CommunityRegistry | typeof SHADCN_REGISTRY_NAME | string,
  itemName: string
): string {
  if (
    typeof registry === 'string' &&
    (registry === SHADCN_REGISTRY_NAME || registry === 'shadcn')
  ) {
    return SHADCN_ITEM_URL_TEMPLATE.replace('{name}', itemName);
  }
  if (typeof registry === 'string') {
    throw new Error(`Unknown registry: ${registry}`);
  }
  return registry.url.replace('{name}', itemName);
}

/** Build the candidate index URLs for a registry (list of items), in priority
 *  order. Shadcn-style registries expose `/r/index.json` (returns an array);
 *  newer registry.json-style exposes `/r/registry.json` (returns `{ items }`).
 *  Caller probes each URL until one returns 200; empty array if none. */
export function buildIndexUrls(
  registry: CommunityRegistry | typeof SHADCN_REGISTRY_NAME | string
): string[] {
  if (
    typeof registry === 'string' &&
    (registry === SHADCN_REGISTRY_NAME || registry === 'shadcn')
  ) {
    return [SHADCN_INDEX_URL];
  }
  if (typeof registry === 'string') return [];
  try {
    const placeholder = registry.url.replace('{name}', '__INDEX_PROBE__');
    const u = new URL(placeholder);
    const parts = u.pathname.split('/');
    const last = parts[parts.length - 1];
    if (!last || !last.includes('__INDEX_PROBE__')) return [];
    // Build one URL per known index filename convention.
    const urls: string[] = [];
    for (const fname of ['registry.json', 'index.json']) {
      const copy = [...parts];
      copy[copy.length - 1] = fname;
      const nextU = new URL(u.toString());
      nextU.pathname = copy.join('/');
      urls.push(nextU.toString());
    }
    return urls;
  } catch (err) {
    // Malformed URL template in registries.json — surface in logs so a broken
    // registry descriptor doesn't silently look like "empty registry".
    console.warn('[shadcn-proxy] invalid registry URL template', registry, err);
    return [];
  }
}

/** Back-compat: first candidate URL only. */
export function buildIndexUrl(
  registry: CommunityRegistry | typeof SHADCN_REGISTRY_NAME | string
): string | null {
  return buildIndexUrls(registry)[0] ?? null;
}

/** Minimal CF RequestInitCfProperties shim for Response typing. */
type RequestInitCfProperties = {
  cacheTtl?: number;
  cacheEverything?: boolean;
};

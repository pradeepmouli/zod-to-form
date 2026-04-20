/**
 * Shared helpers for the /api/shadcn/* Cloudflare Pages Functions.
 *
 * The playground's Vite dev middleware (apps/playground/vite.config.ts)
 * uses the Node-only `shadcn/registry` package. Cloudflare Pages Functions
 * run on the Workers runtime, so these handlers re-implement the subset
 * of registry behavior we need using plain `fetch()`.
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

/** Matches community registry names like `@foo`, `@foo-bar`, `@foo.bar`. */
const REGISTRY_NAME_PATTERN = /^@[a-z0-9][a-z0-9._-]{0,63}$/i;

export function isValidRegistryName(name: string): boolean {
  return REGISTRY_NAME_PATTERN.test(name);
}

/** Only allow proxying to these hostnames (shadcn.com + community sites
 *  from registries.json). Populated dynamically from the allowlist. */
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

/** Build the index URL for a registry (list of items). Returns null if we
 *  don't know a reliable index path for that registry (caller should fall
 *  back to empty results / manual entry). */
export function buildIndexUrl(
  registry: CommunityRegistry | typeof SHADCN_REGISTRY_NAME | string
): string | null {
  if (
    typeof registry === 'string' &&
    (registry === SHADCN_REGISTRY_NAME || registry === 'shadcn')
  ) {
    return SHADCN_INDEX_URL;
  }
  if (typeof registry === 'string') return null;
  // Convention: most shadcn-compatible registries expose `/r/index.json`
  // at the same origin as their `/r/{name}.json` template. If the URL
  // pattern doesn't fit, return null.
  try {
    const placeholder = registry.url.replace('{name}', '__INDEX_PROBE__');
    const u = new URL(placeholder);
    // Replace the last path segment with `index.json`.
    const parts = u.pathname.split('/');
    const last = parts[parts.length - 1];
    if (!last.includes('__INDEX_PROBE__')) return null;
    parts[parts.length - 1] = 'index.json';
    u.pathname = parts.join('/');
    return u.toString();
  } catch {
    return null;
  }
}

/** Minimal CF RequestInitCfProperties shim for Response typing. */
type RequestInitCfProperties = {
  cacheTtl?: number;
  cacheEverything?: boolean;
};

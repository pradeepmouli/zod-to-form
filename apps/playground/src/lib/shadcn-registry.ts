/**
 * Fetches real shadcn/ui component sources for the playground preview.
 *
 * Wire: client POSTs same-origin `/api/shadcn/resolve` with an `items`
 * array. The request is handled by:
 *   - Dev: Vite middleware (apps/playground/vite.config.ts `shadcnRegistryPlugin`)
 *   - Prod: Cloudflare Worker at apps/shadcn-proxy/ bound to the Route
 *           `zod.toform.dev/api/shadcn/*`
 *
 * Response files are mapped into a `Record<key, source>` map (keyed by
 * `ui/<component>` so runtime module resolution finds them) and cached
 * in localStorage for 24h. The client returns a soft-failure shape
 * `{ sources, errors }` — callers surface the errors rather than throw.
 */

const RESOLVE_URL = '/api/shadcn/resolve';
const CACHE_KEY = 'z2f-shadcn-registry-cache';
/** Bumped from 1 to 2 when the transport changed to the proxy. */
const CACHE_VERSION = 2;

/** Components needed for form rendering in the playground. */
const CORE_COMPONENTS = [
  'button',
  'checkbox',
  'input',
  'label',
  'select',
  'switch',
  'textarea'
] as const;

interface ResolveFile {
  path: string;
  type?: string;
  content?: string | null;
}

interface ResolveResponse {
  files: ResolveFile[];
  dependencies?: string[];
  devDependencies?: string[];
  cssVars?: Record<string, Record<string, string>>;
}

interface CacheEntry {
  version: number;
  timestamp: number;
  sources: Record<string, string>;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function loadCache(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.version !== CACHE_VERSION) return null;
    if (Date.now() - entry.timestamp > ONE_DAY_MS) return null;
    return entry.sources;
  } catch {
    return null;
  }
}

function saveCache(sources: Record<string, string>): void {
  try {
    const entry: CacheEntry = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      sources
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage full or disabled — silently skip
  }
}

/** Map `files[]` from the proxy into the `ui/<name>` → source map the
 *  runtime compiler expects. Non-TS/JS entries are skipped. */
function filesToSources(files: ResolveFile[]): Record<string, string> {
  const sources: Record<string, string> = {};
  for (const file of files) {
    if (typeof file?.content !== 'string' || !file.content) continue;
    if (!/\.(tsx?|jsx?)$/.test(file.path)) continue;
    const key = file.path
      .replace(/^registry\/[^/]+\//, '')
      .replace(/^src\//, '')
      .replace(/\.(tsx?|jsx?)$/, '');
    sources[key] = file.content;
  }
  return sources;
}

async function resolveItems(items: readonly string[]): Promise<Record<string, string>> {
  const res = await fetch(RESOLVE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });
  if (!res.ok) {
    throw new Error(`Failed to resolve (${items.join(',')}): HTTP ${res.status}`);
  }
  const data = (await res.json()) as ResolveResponse;
  if (!data || !Array.isArray(data.files)) {
    throw new Error('Malformed resolve response');
  }
  return filesToSources(data.files);
}

export interface FetchResult {
  sources: Record<string, string>;
  errors: string[];
}

/**
 * Fetch shadcn/ui component sources. If `extra` names are provided and
 * the cache is already warm, only the missing names are fetched and
 * merged into the cache (on-demand path for US3).
 */
export async function fetchShadcnSources(extra: readonly string[] = []): Promise<FetchResult> {
  const cached = loadCache() ?? {};
  const haveCore = CORE_COMPONENTS.every((name) => `ui/${name}` in cached);

  // On-demand: core already cached, just fetch the missing extras.
  if (haveCore && extra.length > 0) {
    const missing = extra.filter((name) => !(`ui/${name}` in cached));
    if (missing.length === 0) {
      return { sources: cached, errors: [] };
    }
    try {
      const newSources = await resolveItems(missing);
      const merged = { ...cached, ...newSources };
      saveCache(merged);
      return { sources: merged, errors: [] };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown fetch error';
      return { sources: cached, errors: [message] };
    }
  }

  // Warm cache with no extras to fetch.
  if (haveCore && extra.length === 0) {
    return { sources: cached, errors: [] };
  }

  // Cold cache (or missing-core) — fetch core + any extras in one round-trip.
  const toFetch = [...CORE_COMPONENTS, ...extra];
  try {
    const sources = await resolveItems(toFetch);
    if (Object.keys(sources).length > 0) {
      saveCache(sources);
    }
    return { sources, errors: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error';
    return { sources: cached, errors: [message] };
  }
}

/** Clear the cached registry sources (forces re-fetch on next load). */
export function clearShadcnCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // localStorage disabled — nothing to clear
  }
}

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
/** Matches the MAX_ITEMS cap in apps/shadcn-proxy/src/resolve.ts — the Worker
 *  will 400 past this, so cap client-side to avoid a guaranteed-degraded path. */
const MAX_RESOLVE_ITEMS = 20;

/** Dedupe + strip empties from a request list, preserving insertion order. */
function normalizeItems(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of items) {
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

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
  } catch (err) {
    // SyntaxError from a partially-written entry and DOMException from
    // locked-down localStorage (e.g. SecurityError in private mode) are
    // both benign → silent cache miss. Surface anything else so genuine
    // bugs don't hide forever.
    if (!isBenignStorageError(err)) {
      console.warn('[zod-to-form] unexpected shadcn cache read error:', err);
    }
    return null;
  }
}

/** True for the set of errors that are expected when localStorage is
 *  restricted, corrupted, or out of quota. These should not log a warning. */
function isBenignStorageError(err: unknown): boolean {
  if (err instanceof SyntaxError) return true;
  if (typeof DOMException !== 'undefined' && err instanceof DOMException) return true;
  // Some legacy runtimes throw plain objects with a `name` field.
  if (err && typeof err === 'object' && 'name' in err) {
    const name = String((err as { name: unknown }).name);
    if (
      name === 'QuotaExceededError' ||
      name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      name === 'SecurityError'
    ) {
      return true;
    }
  }
  return false;
}

function saveCache(sources: Record<string, string>): void {
  try {
    const entry: CacheEntry = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      sources
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (err) {
    // Quota exceeded / private mode / disabled storage are all expected
    // (and typically surface as DOMException, not Error). Other throws
    // (e.g. TypeError from non-stringifiable sources) would indicate a bug.
    if (!isBenignStorageError(err)) {
      console.warn('[zod-to-form] unexpected shadcn cache write error:', err);
    }
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
  const normalized = normalizeItems(items);
  if (normalized.length === 0) return {};
  if (normalized.length > MAX_RESOLVE_ITEMS) {
    throw new Error(
      `Too many components to resolve in one request (${normalized.length} > ${MAX_RESOLVE_ITEMS})`
    );
  }
  const res = await fetch(RESOLVE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: normalized })
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
  /** Component-source map, keyed `ui/<name>` for runtime compiler lookup.
   *  May be partial (even empty) when `errors` is non-empty — callers should
   *  surface the degraded state rather than treating an empty map as "done". */
  readonly sources: Readonly<Record<string, string>>;
  /** Human-readable failures. Empty array on full success; non-empty means
   *  fetch fell back to cached-or-empty sources — the UI should surface this. */
  readonly errors: readonly string[];
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

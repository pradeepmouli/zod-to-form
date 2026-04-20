/**
 * Fetches real shadcn/ui component sources from the public registry and
 * caches them in localStorage. Used to provide native shadcn components
 * in the playground without requiring a dev-server proxy.
 */

const REGISTRY_BASE = 'https://ui.shadcn.com/r/styles/new-york-v4';
const CACHE_KEY = 'z2f-shadcn-registry-cache';
const CACHE_VERSION = 1;

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

interface RegistryFile {
  path: string;
  type: string;
  content: string;
  target?: string;
}

interface RegistryResponse {
  name: string;
  type: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
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
    const entry: CacheEntry = JSON.parse(raw);
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

async function fetchComponent(name: string): Promise<Record<string, string>> {
  const url = `${REGISTRY_BASE}/${name}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${name}: HTTP ${res.status}`);
  }
  const data: RegistryResponse = await res.json();

  const sources: Record<string, string> = {};
  for (const file of data.files) {
    if (file.content && file.path.match(/\.(tsx?|jsx?)$/)) {
      // Use the filename without extension as the key (e.g., "ui/checkbox")
      const key = file.path
        .replace(/^src\//, '')
        .replace(/\.tsx?$/, '')
        .replace(/\.jsx?$/, '');
      sources[key] = file.content;
    }
  }
  return sources;
}

export interface FetchResult {
  sources: Record<string, string>;
  errors: string[];
}

/**
 * Fetch all core shadcn/ui component sources needed for form rendering.
 * Returns cached results if available and fresh (< 24h).
 */
export async function fetchShadcnSources(): Promise<FetchResult> {
  const cached = loadCache();
  if (cached && Object.keys(cached).length > 0) {
    return { sources: cached, errors: [] };
  }

  const allSources: Record<string, string> = {};
  const errors: string[] = [];

  // Fetch all components in parallel
  const results = await Promise.allSettled(
    CORE_COMPONENTS.map(async (name) => {
      const sources = await fetchComponent(name);
      return { name, sources };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      Object.assign(allSources, result.value.sources);
    } else {
      errors.push(result.reason?.message ?? 'Unknown fetch error');
    }
  }

  if (Object.keys(allSources).length > 0) {
    saveCache(allSources);
  }

  return { sources: allSources, errors };
}

/** Clear the cached registry sources (forces re-fetch on next load). */
export function clearShadcnCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

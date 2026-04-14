/**
 * HMR helpers.
 *
 * `computeHmrInvalidation` is the pure side: given a changed file path,
 * the cache, and the config file path, it returns the list of evicted
 * cache keys (which the dispatching `handleHotUpdate` hook converts to
 * Vite module ids).
 *
 * The hook itself lives in `plugin.ts` — it converts the result of this
 * function into the array of `ModuleNode` objects Vite expects to
 * invalidate.
 */
import type { CompilationCache } from './cache.js';

export interface HmrInvalidationInput {
  /** Absolute path of the file that just changed. */
  changedFile: string;
  /** Absolute path of the project's `z2f.config.ts` (or undefined if unknown). */
  configFile: string | undefined;
  /** The plugin's compilation cache. */
  cache: CompilationCache;
}

export interface HmrInvalidationResult {
  /**
   * `'config'` means the config file changed and the entire cache was
   * evicted. `'schema'` means a tracked schema file changed and only
   * entries depending on it were evicted.
   */
  kind: 'config' | 'schema';
  /** The cache keys that were evicted. */
  evictedKeys: string[];
}

/**
 * Decide what to invalidate when a file changes.
 *
 * Returns `null` to signal "fall through to Vite's default HMR behavior"
 * — the changed file is neither the config nor a tracked schema, so the
 * plugin has nothing to do.
 *
 * Returns a result object when the plugin DID invalidate something. The
 * caller is responsible for converting the evicted keys back into Vite
 * module ids (each key has the form `<schemaFile>::<variant>::<configHash>`).
 */
export function computeHmrInvalidation(input: HmrInvalidationInput): HmrInvalidationResult | null {
  const { changedFile, configFile, cache } = input;

  // Config file changed → wipe everything
  if (configFile !== undefined && changedFile === configFile) {
    const evictedKeys = cache.invalidateAll();
    return { kind: 'config', evictedKeys };
  }

  // Schema file changed → surgical eviction
  const evictedKeys = cache.invalidateByFile(changedFile);
  if (evictedKeys.length === 0) {
    // The cache had nothing for this file. The plugin has no business
    // here; let Vite handle the file via its normal HMR machinery.
    return null;
  }
  return { kind: 'schema', evictedKeys };
}

/**
 * Convert a cache key (`<schemaFile>::<variant>::<configHash>`) back into
 * the Vite module id Vite uses for that virtual module
 * (`<schemaFile>?z2f[=variant]`).
 *
 * Used by `handleHotUpdate` to map evicted cache keys to the module nodes
 * Vite needs to invalidate.
 */
export function cacheKeyToModuleId(key: string): string {
  // Cache key format: schemaFile::variant::configHash
  const parts = key.split('::');
  if (parts.length !== 3) return key; // defensive — shouldn't happen
  const [schemaFile, variant] = parts;
  const query = variant === '' ? '?z2f' : `?z2f=${variant}`;
  return `${schemaFile}${query}`;
}

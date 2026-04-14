/**
 * CompilationCache — entity #3 from `data-model.md`.
 *
 * Stores the result of compiling each (schemaFile, variant, configHash)
 * triple to a generated form module. Maintains a reverse index so HMR can
 * invalidate every entry that depends on a given schema file in O(1).
 *
 * The cache is single-threaded: Vite runs plugin hooks sequentially on the
 * main event loop, so no locking is needed.
 */
import type { CompilationEntry, GenerationTarget } from './types.js';

export interface CacheStats {
  /** Number of entries currently in the cache. */
  size: number;
  /** Number of cache hits since the cache was created. */
  hits: number;
  /** Number of cache misses since the cache was created. */
  misses: number;
}

export interface CompilationCache {
  /** Look up a cached compilation by target. Returns undefined on miss. */
  get(target: GenerationTarget): CompilationEntry | undefined;

  /** Store a compilation result. Updates the reverse index. */
  set(target: GenerationTarget, entry: CompilationEntry): void;

  /**
   * Evict every entry whose `schemaFile` equals the given path.
   * Returns the list of evicted cache keys for HMR fan-out.
   */
  invalidateByFile(schemaFile: string): string[];

  /**
   * Evict every cache entry. Used when the config file changes.
   * Returns the list of evicted cache keys for HMR fan-out.
   */
  invalidateAll(): string[];

  /** Snapshot of cache size and hit/miss counters. */
  stats(): CacheStats;
}

/** Build a stable key from a target. */
function keyFor(target: GenerationTarget): string {
  return `${target.schemaFile}::${target.variant}::${target.configHash}`;
}

export function createCompilationCache(): CompilationCache {
  const entries = new Map<string, CompilationEntry>();
  const byFile = new Map<string, Set<string>>();
  let hits = 0;
  let misses = 0;

  return {
    get(target): CompilationEntry | undefined {
      const key = keyFor(target);
      const entry = entries.get(key);
      if (entry === undefined) {
        misses += 1;
        return undefined;
      }
      hits += 1;
      return entry;
    },

    set(target, entry): void {
      const key = keyFor(target);
      entries.set(key, entry);

      let group = byFile.get(target.schemaFile);
      if (group === undefined) {
        group = new Set<string>();
        byFile.set(target.schemaFile, group);
      }
      group.add(key);
    },

    invalidateByFile(schemaFile): string[] {
      const group = byFile.get(schemaFile);
      if (group === undefined || group.size === 0) {
        return [];
      }
      const evicted: string[] = [];
      for (const key of group) {
        if (entries.delete(key)) {
          evicted.push(key);
        }
      }
      byFile.delete(schemaFile);
      return evicted;
    },

    invalidateAll(): string[] {
      const evicted = Array.from(entries.keys());
      entries.clear();
      byFile.clear();
      return evicted;
    },

    stats(): CacheStats {
      return { size: entries.size, hits, misses };
    }
  };
}

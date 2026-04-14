import { describe, expect, it } from 'vitest';
import { computeHmrInvalidation } from '../../src/hmr.js';
import { createCompilationCache } from '../../src/cache.js';
import type { CompilationEntry, GenerationTarget } from '../../src/types.js';

/**
 * Contract: computeHmrInvalidation is the pure side of `handleHotUpdate`.
 * Given the changed file path, the cache, and the configFile path, it
 * returns the list of evicted cache keys (which the dispatching plugin
 * hook converts to Vite module ids).
 *
 * Three cases:
 * - Changed file is the config → evict everything (returns all keys)
 * - Changed file is a watched schema → evict only entries depending on it
 * - Changed file is unrelated → return null (signals "fall through to
 *   Vite's default HMR behavior")
 */

function makeTarget(overrides: Partial<GenerationTarget> = {}): GenerationTarget {
  return {
    schemaFile: '/abs/src/schemas/signup.ts',
    exportName: 'signupSchema',
    variant: '',
    configHash: 'abc',
    componentName: 'SignupForm',
    sourceKind: 'query',
    ...overrides
  };
}

function makeEntry(target: GenerationTarget): CompilationEntry {
  return {
    target,
    generatedSource: '/* generated */',
    schemaLiteSource: null,
    sourceMap: null,
    emittedAt: 1
  };
}

describe('computeHmrInvalidation', () => {
  it('returns null when the changed file has nothing to do with the cache', () => {
    const cache = createCompilationCache();
    cache.set(makeTarget(), makeEntry(makeTarget()));

    const result = computeHmrInvalidation({
      changedFile: '/abs/src/unrelated.ts',
      configFile: '/abs/z2f.config.ts',
      cache
    });

    expect(result).toBeNull();
  });

  it('evicts every cache entry when the config file changes', () => {
    const cache = createCompilationCache();
    const a = makeTarget({ schemaFile: '/abs/a.ts' });
    const b = makeTarget({ schemaFile: '/abs/b.ts' });
    cache.set(a, makeEntry(a));
    cache.set(b, makeEntry(b));

    const result = computeHmrInvalidation({
      changedFile: '/abs/z2f.config.ts',
      configFile: '/abs/z2f.config.ts',
      cache
    });

    expect(result).not.toBeNull();
    expect(result?.kind).toBe('config');
    expect(result?.evictedKeys.length).toBe(2);
    // Cache should be empty after the eviction
    expect(cache.stats().size).toBe(0);
  });

  it('evicts only entries depending on the changed schema file', () => {
    const cache = createCompilationCache();
    const a1 = makeTarget({ schemaFile: '/abs/a.ts', variant: '' });
    const a2 = makeTarget({ schemaFile: '/abs/a.ts', variant: 'edit' });
    const b = makeTarget({ schemaFile: '/abs/b.ts', variant: '' });
    cache.set(a1, makeEntry(a1));
    cache.set(a2, makeEntry(a2));
    cache.set(b, makeEntry(b));

    const result = computeHmrInvalidation({
      changedFile: '/abs/a.ts',
      configFile: '/abs/z2f.config.ts',
      cache
    });

    expect(result).not.toBeNull();
    expect(result?.kind).toBe('schema');
    expect(result?.evictedKeys.length).toBe(2);
    // The b entry survives
    expect(cache.stats().size).toBe(1);
  });

  it('returns null (not an empty schema invalidation) when cache has no entries for the file', () => {
    const cache = createCompilationCache();
    const a = makeTarget({ schemaFile: '/abs/a.ts' });
    cache.set(a, makeEntry(a));

    const result = computeHmrInvalidation({
      changedFile: '/abs/never-touched.ts',
      configFile: '/abs/z2f.config.ts',
      cache
    });

    expect(result).toBeNull();
  });

  it('handles config invalidation even when the cache is empty', () => {
    const cache = createCompilationCache();
    const result = computeHmrInvalidation({
      changedFile: '/abs/z2f.config.ts',
      configFile: '/abs/z2f.config.ts',
      cache
    });
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('config');
    expect(result?.evictedKeys).toEqual([]);
  });
});

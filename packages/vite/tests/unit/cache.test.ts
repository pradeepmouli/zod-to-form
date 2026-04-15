import { describe, expect, it } from 'vitest';
import { createCompilationCache } from '../../src/cache.js';
import type { CompilationEntry, GenerationTarget } from '../../src/types.js';

/**
 * Contract: CompilationCache stores per-target compilation results, keyed
 * by `${schemaFile}::${variant}::${configHash}`, and supports surgical
 * invalidation either by source file (one schema changed → evict only
 * entries depending on it) or wholesale (config changed → evict everything).
 *
 * The reverse index `byFile` MUST stay consistent with the primary store
 * across every operation.
 */

type QueryTarget = Extract<GenerationTarget, { sourceKind: 'query' }>;

function makeTarget(overrides: Partial<QueryTarget> = {}): QueryTarget {
  return {
    schemaFile: '/abs/src/schemas/signup.ts',
    exportName: 'signupSchema',
    variant: '',
    configHash: 'abc123',
    componentName: 'SignupForm',
    sourceKind: 'query',
    ...overrides
  };
}

function makeEntry(target: GenerationTarget = makeTarget()): CompilationEntry {
  return {
    target,
    generatedSource: '/* generated */',
    schemaLiteSource: null,
    sourceMap: null,
    emittedAt: 1
  };
}

describe('CompilationCache', () => {
  describe('get / set roundtrip', () => {
    it('returns undefined for a miss', () => {
      const cache = createCompilationCache();
      expect(cache.get(makeTarget())).toBeUndefined();
    });

    it('returns the entry for a hit', () => {
      const cache = createCompilationCache();
      const target = makeTarget();
      const entry = makeEntry(target);
      cache.set(target, entry);
      expect(cache.get(target)).toBe(entry);
    });

    it('treats different variants as different keys', () => {
      const cache = createCompilationCache();
      const def = makeTarget({ variant: '' });
      const edit = makeTarget({ variant: 'edit' });
      cache.set(def, makeEntry(def));
      cache.set(edit, makeEntry(edit));
      expect(cache.get(def)).toBeDefined();
      expect(cache.get(edit)).toBeDefined();
      expect(cache.get(def)).not.toBe(cache.get(edit));
    });

    it('treats different config hashes as different keys', () => {
      const cache = createCompilationCache();
      const a = makeTarget({ configHash: 'aaa' });
      const b = makeTarget({ configHash: 'bbb' });
      cache.set(a, makeEntry(a));
      cache.set(b, makeEntry(b));
      expect(cache.get(a)).toBeDefined();
      expect(cache.get(b)).toBeDefined();
      expect(cache.get(a)).not.toBe(cache.get(b));
    });

    it('treats different schema files as different keys', () => {
      const cache = createCompilationCache();
      const a = makeTarget({ schemaFile: '/abs/src/schemas/a.ts' });
      const b = makeTarget({ schemaFile: '/abs/src/schemas/b.ts' });
      cache.set(a, makeEntry(a));
      cache.set(b, makeEntry(b));
      expect(cache.get(a)).toBeDefined();
      expect(cache.get(b)).toBeDefined();
    });
  });

  describe('invalidateByFile', () => {
    it('evicts every entry whose schemaFile equals the changed file', () => {
      const cache = createCompilationCache();
      const a1 = makeTarget({ schemaFile: '/abs/a.ts', variant: '' });
      const a2 = makeTarget({ schemaFile: '/abs/a.ts', variant: 'edit' });
      const b = makeTarget({ schemaFile: '/abs/b.ts', variant: '' });

      cache.set(a1, makeEntry(a1));
      cache.set(a2, makeEntry(a2));
      cache.set(b, makeEntry(b));

      const evicted = cache.invalidateByFile('/abs/a.ts');

      expect(evicted.length).toBe(2);
      expect(cache.get(a1)).toBeUndefined();
      expect(cache.get(a2)).toBeUndefined();
      expect(cache.get(b)).toBeDefined();
    });

    it('returns an empty list when no entries match', () => {
      const cache = createCompilationCache();
      const a = makeTarget({ schemaFile: '/abs/a.ts' });
      cache.set(a, makeEntry(a));

      const evicted = cache.invalidateByFile('/abs/nowhere.ts');
      expect(evicted).toEqual([]);
      expect(cache.get(a)).toBeDefined();
    });
  });

  describe('invalidateAll', () => {
    it('evicts every entry and returns the full key list', () => {
      const cache = createCompilationCache();
      const a = makeTarget({ schemaFile: '/abs/a.ts' });
      const b = makeTarget({ schemaFile: '/abs/b.ts' });
      cache.set(a, makeEntry(a));
      cache.set(b, makeEntry(b));

      const evicted = cache.invalidateAll();

      expect(evicted.length).toBe(2);
      expect(cache.get(a)).toBeUndefined();
      expect(cache.get(b)).toBeUndefined();
    });
  });

  describe('reverse index consistency (byFile)', () => {
    it('removes the byFile entry when the last cache entry for a file is evicted', () => {
      const cache = createCompilationCache();
      const a = makeTarget({ schemaFile: '/abs/a.ts' });
      cache.set(a, makeEntry(a));
      cache.invalidateByFile('/abs/a.ts');
      // A subsequent invalidation of the same file MUST return [] — proving
      // the reverse index was actually cleaned up, not just the primary store.
      expect(cache.invalidateByFile('/abs/a.ts')).toEqual([]);
    });

    it('keeps the byFile entry alive when other variants for the file remain', () => {
      const cache = createCompilationCache();
      const a1 = makeTarget({ schemaFile: '/abs/a.ts', variant: '' });
      const a2 = makeTarget({ schemaFile: '/abs/a.ts', variant: 'edit' });
      cache.set(a1, makeEntry(a1));
      cache.set(a2, makeEntry(a2));

      // Set then immediately update one variant — the index still tracks both.
      cache.set(a1, { ...makeEntry(a1), emittedAt: 2 });
      const evicted = cache.invalidateByFile('/abs/a.ts');
      expect(evicted.length).toBe(2);
    });
  });

  describe('stats', () => {
    it('returns a snapshot of cache size and counters', () => {
      const cache = createCompilationCache();
      const a = makeTarget();
      cache.set(a, makeEntry(a));
      cache.get(a); // hit
      cache.get(makeTarget({ variant: 'edit' })); // miss

      const stats = cache.stats();
      expect(stats.size).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });
});

/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearShadcnCache,
  fetchShadcnSources,
  type FetchResult
} from '../../src/lib/shadcn-registry.ts';

const CACHE_KEY = 'z2f-shadcn-registry-cache';
const CURRENT_VERSION = 2;
const CORE_KEYS = ['button', 'checkbox', 'input', 'label', 'select', 'switch', 'textarea'];

function makeResolveResponse(names: readonly string[]) {
  const files = names.map((name) => ({
    path: `registry/new-york-v4/ui/${name}.tsx`,
    type: 'registry:ui',
    content: `export function ${name.charAt(0).toUpperCase() + name.slice(1)}() { return null; }`
  }));
  return {
    files,
    dependencies: [],
    devDependencies: [],
    cssVars: {}
  };
}

function mockFetchOnce(body: unknown, init: { status?: number } = {}): ReturnType<typeof vi.fn> {
  const fn = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status: init.status ?? 200,
        headers: { 'Content-Type': 'application/json' }
      })
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('fetchShadcnSources', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('cold cache: POSTs to /api/shadcn/resolve and maps files into ui/<name> keys', async () => {
    const fetchMock = mockFetchOnce(makeResolveResponse(CORE_KEYS));

    const result: FetchResult = await fetchShadcnSources();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(call![0]).toBe('/api/shadcn/resolve');
    expect(call![1]!.method).toBe('POST');
    const body = JSON.parse(call![1]!.body as string);
    expect(body.items).toEqual(CORE_KEYS);

    expect(result.errors).toEqual([]);
    for (const name of CORE_KEYS) {
      expect(result.sources[`ui/${name}`]).toMatch(/^export function/);
    }

    const stored = JSON.parse(localStorage.getItem(CACHE_KEY)!);
    expect(stored.version).toBe(CURRENT_VERSION);
    expect(stored.sources['ui/button']).toMatch(/^export function/);
  });

  it('warm cache: does not call fetch', async () => {
    const sources = Object.fromEntries(CORE_KEYS.map((n) => [`ui/${n}`, `src-${n}`]));
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CURRENT_VERSION, timestamp: Date.now(), sources })
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchShadcnSources();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.sources).toEqual(sources);
    expect(result.errors).toEqual([]);
  });

  it('stale version (v1): ignores cache and re-fetches', async () => {
    const oldSources = Object.fromEntries(CORE_KEYS.map((n) => [`ui/${n}`, `old-${n}`]));
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: 1, timestamp: Date.now(), sources: oldSources })
    );
    const fetchMock = mockFetchOnce(makeResolveResponse(CORE_KEYS));

    const result = await fetchShadcnSources();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.sources['ui/button']).toMatch(/^export function/);
  });

  it('server 5xx: returns cached sources (empty) + error message, does not throw', async () => {
    const fetchMock = mockFetchOnce({ error: 'boom' }, { status: 500 });

    const result = await fetchShadcnSources();

    expect(fetchMock).toHaveBeenCalled();
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toMatch(/500/);
    expect(result.sources).toEqual({});
  });

  it('network throw: returns cached sources + error, does not throw', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchShadcnSources();

    expect(result.errors).toEqual(['Failed to fetch']);
    expect(result.sources).toEqual({});
  });

  it('on-demand: with warm cache, fetches only missing extras and merges', async () => {
    const sources = Object.fromEntries(CORE_KEYS.map((n) => [`ui/${n}`, `src-${n}`]));
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CURRENT_VERSION, timestamp: Date.now(), sources })
    );
    const fetchMock = mockFetchOnce(makeResolveResponse(['radio-group']));

    const result = await fetchShadcnSources(['radio-group']);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(body.items).toEqual(['radio-group']);
    expect(result.sources['ui/radio-group']).toMatch(/^export function/);
    expect(result.sources['ui/button']).toBe('src-button');
  });

  it('on-demand: all extras already cached → no fetch', async () => {
    const sources = Object.fromEntries(
      [...CORE_KEYS, 'radio-group'].map((n) => [`ui/${n}`, `src-${n}`])
    );
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CURRENT_VERSION, timestamp: Date.now(), sources })
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchShadcnSources(['radio-group']);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.sources['ui/radio-group']).toBe('src-radio-group');
  });
});

describe('clearShadcnCache', () => {
  it('removes the cache entry', () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ version: 2, timestamp: 0, sources: {} }));
    clearShadcnCache();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });
});

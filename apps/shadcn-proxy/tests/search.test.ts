import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleSearch, handleSearchOptions } from '../src/search';

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

afterEach(() => {
  vi.unstubAllGlobals();
});

function req(qs: string): Request {
  return new Request(`https://zod.toform.dev/api/shadcn/search?${qs}`, { method: 'GET' });
}

describe('handleSearchOptions', () => {
  it('returns 204 with CORS headers', () => {
    const res = handleSearchOptions();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('handleSearch — @shadcn (builtin)', () => {
  it('returns mapped items from the index.json array shape', async () => {
    const fetchMock = vi.fn<FetchFn>(
      async () =>
        new Response(
          JSON.stringify([
            { name: 'button', type: 'registry:ui', description: 'A button.' },
            { name: 'checkbox', type: 'registry:ui', description: 'A checkbox.' }
          ]),
          { status: 200 }
        )
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await handleSearch(req('registry=@shadcn'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ name: string; addCommandArgument: string }>;
      pagination: { total: number };
    };

    expect(body.pagination.total).toBe(2);
    expect(body.items).toHaveLength(2);
    expect(body.items[0]!.name).toBe('button');
    // @shadcn items use the bare name (no registry prefix).
    expect(body.items[0]!.addCommandArgument).toBe('button');
  });

  it('filters by `q` against name + description', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchFn>(
        async () =>
          new Response(
            JSON.stringify([
              { name: 'button', description: 'A clickable thing' },
              { name: 'checkbox', description: 'A checkable thing' },
              { name: 'input', description: 'A text input' }
            ]),
            { status: 200 }
          )
      )
    );

    const res = await handleSearch(req('registry=@shadcn&q=click'));
    const body = (await res.json()) as { items: Array<{ name: string }> };
    expect(body.items).toHaveLength(1);
    expect(body.items[0]!.name).toBe('button');
  });
});

describe('handleSearch — community registry probing', () => {
  // Minimal registries.json payload covering one community registry.
  const registriesPayload = [{ name: '@foo', url: 'https://foo.example/r/{name}.json' }];

  it('falls through from registry.json 404 to index.json 200 (array shape)', async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn<FetchFn>(async (url: string) => {
      calls.push(url);
      if (url.endsWith('registries.json')) {
        return new Response(JSON.stringify(registriesPayload), { status: 200 });
      }
      if (url.endsWith('/r/registry.json')) {
        return new Response('not found', { status: 404 });
      }
      if (url.endsWith('/r/index.json')) {
        return new Response(JSON.stringify([{ name: 'widget' }]), { status: 200 });
      }
      throw new Error(`unexpected url: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await handleSearch(req('registry=@foo'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ name: string; addCommandArgument: string }>;
    };
    expect(body.items).toHaveLength(1);
    expect(body.items[0]!.name).toBe('widget');
    // Community items prefix the registry name in the add-command arg.
    expect(body.items[0]!.addCommandArgument).toBe('@foo/widget');
    // Both probe URLs were attempted in order.
    expect(calls.some((u) => u.endsWith('/r/registry.json'))).toBe(true);
    expect(calls.some((u) => u.endsWith('/r/index.json'))).toBe(true);
  });

  it('accepts the {items:[...]} wrapper shape from registry.json', async () => {
    const fetchMock = vi.fn<FetchFn>(async (url: string) => {
      if (url.endsWith('registries.json')) {
        return new Response(JSON.stringify(registriesPayload), { status: 200 });
      }
      if (url.endsWith('/r/registry.json')) {
        return new Response(
          JSON.stringify({ name: 'foo', items: [{ name: 'hero' }, { name: 'banner' }] }),
          { status: 200 }
        );
      }
      throw new Error(`unexpected url: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await handleSearch(req('registry=@foo'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ name: string }> };
    expect(body.items.map((i) => i.name)).toEqual(['hero', 'banner']);
  });

  it('returns empty items when all probe URLs 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchFn>(async (url: string) => {
        if (url.endsWith('registries.json')) {
          return new Response(JSON.stringify(registriesPayload), { status: 200 });
        }
        return new Response('nope', { status: 404 });
      })
    );

    const res = await handleSearch(req('registry=@foo'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[]; pagination: { total: number } };
    expect(body.items).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it('returns 502 when the upstream fails with a non-404 status (masking prevention)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchFn>(async (url: string) => {
        if (url.endsWith('registries.json')) {
          return new Response(JSON.stringify(registriesPayload), { status: 200 });
        }
        // Both probes return 503 — must surface, not pretend "empty".
        return new Response('gateway down', { status: 503 });
      })
    );

    const res = await handleSearch(req('registry=@foo'));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/503/);
  });

  it('returns 404 for an unknown community registry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchFn>(async () => new Response(JSON.stringify(registriesPayload), { status: 200 }))
    );

    const res = await handleSearch(req('registry=@does-not-exist'));
    expect(res.status).toBe(404);
  });
});

describe('handleSearch — validation', () => {
  it('returns 400 when registry param is missing', async () => {
    const res = await handleSearch(req(''));
    expect(res.status).toBe(400);
  });

  it('returns 400 when registry param is invalid (uppercase rejected)', async () => {
    const res = await handleSearch(req('registry=@SHADCN'));
    expect(res.status).toBe(400);
  });
});

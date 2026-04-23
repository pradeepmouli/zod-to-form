import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleResolve, handleResolveOptions } from '../src/resolve';

// Typed mock factory so call[i][0] is `string` (the URL).
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

const SAMPLE_BUTTON_ITEM = {
  name: 'button',
  type: 'registry:ui',
  dependencies: ['class-variance-authority'],
  devDependencies: [],
  files: [
    {
      path: 'registry/new-york-v4/ui/button.tsx',
      type: 'registry:ui',
      content: 'export function Button() { return null; }'
    }
  ]
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('handleResolveOptions', () => {
  it('returns 204 with CORS headers', () => {
    const res = handleResolveOptions();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});

describe('handleResolve', () => {
  it('returns aggregated files[] for a single @shadcn item', async () => {
    const fetchMock = vi.fn<FetchFn>(
      async () => new Response(JSON.stringify(SAMPLE_BUTTON_ITEM), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const req = new Request('https://zod.toform.dev/api/shadcn/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: ['button'] })
    });

    const res = await handleResolve(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const body = (await res.json()) as {
      files: Array<{ path: string; content: string | null }>;
      dependencies: string[];
    };
    expect(body.files).toHaveLength(1);
    expect(body.files[0]!.path).toBe('registry/new-york-v4/ui/button.tsx');
    expect(body.files[0]!.content).toMatch(/^export function Button/);
    expect(body.dependencies).toContain('class-variance-authority');

    // Verify upstream URL used the shadcn new-york-v4 template
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0]!;
    expect(firstCall[0]).toBe('https://ui.shadcn.com/r/styles/new-york-v4/button.json');
  });

  it('returns 400 on missing items', async () => {
    const req = new Request('https://zod.toform.dev/api/shadcn/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const res = await handleResolve(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 on non-string items entries', async () => {
    const req = new Request('https://zod.toform.dev/api/shadcn/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [1, 2, 3] })
    });
    const res = await handleResolve(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when upstream says the item does not exist', async () => {
    const fetchMock = vi.fn<FetchFn>(async () => new Response('not found', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const req = new Request('https://zod.toform.dev/api/shadcn/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: ['nope'] })
    });
    const res = await handleResolve(req);
    expect(res.status).toBe(404);
  });
});

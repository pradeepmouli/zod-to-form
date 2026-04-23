/**
 * GET /api/shadcn/search?registry=@shadcn&q=&limit=50&offset=0
 */

import {
  CORS_HEADERS,
  SHADCN_REGISTRY_NAME,
  buildIndexUrls,
  errorResponse,
  isValidRegistryName,
  jsonResponse,
  loadRegistries,
  type RegistryIndexItem,
  type SearchResultItem
} from './_shared';

export const handleSearchOptions = (): Response =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const handleSearch = async (request: Request): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const registry = url.searchParams.get('registry');
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();

    const rawLimit = parseInt(url.searchParams.get('limit') ?? '50', 10);
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 50, 1), 100);
    const rawOffset = parseInt(url.searchParams.get('offset') ?? '0', 10);
    const offset = Math.max(Number.isFinite(rawOffset) ? rawOffset : 0, 0);

    if (!registry) {
      return errorResponse("Missing 'registry' param", 400);
    }
    if (!isValidRegistryName(registry)) {
      return errorResponse("Invalid 'registry' param", 400);
    }

    let indexUrls: string[];

    if (registry === SHADCN_REGISTRY_NAME) {
      indexUrls = buildIndexUrls(SHADCN_REGISTRY_NAME);
    } else {
      const { byName } = await loadRegistries();
      const entry = byName.get(registry);
      if (!entry) {
        return errorResponse(`Unknown registry: ${registry}`, 404);
      }
      indexUrls = buildIndexUrls(entry);
    }

    if (indexUrls.length === 0) {
      return jsonResponse({ items: [], pagination: { total: 0 } });
    }

    // Probe candidate URLs in order. Accept either a bare array (shadcn's
    // `/r/index.json` shape) or a `{ items: [...] }` wrapper (newer
    // `/r/registry.json` schema used by most community registries).
    let rawItems: unknown[] | null = null;
    for (const url of indexUrls) {
      const upstream = await fetch(url, {
        headers: { Accept: 'application/json' },
        cf: { cacheTtl: 300, cacheEverything: true }
      });
      if (!upstream.ok) continue;
      const parsed = (await upstream.json()) as unknown;
      if (Array.isArray(parsed)) {
        rawItems = parsed;
        break;
      }
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as { items?: unknown }).items)
      ) {
        rawItems = (parsed as { items: unknown[] }).items;
        break;
      }
    }

    if (!rawItems) {
      return jsonResponse({ items: [], pagination: { total: 0 } });
    }

    const all = (rawItems as RegistryIndexItem[])
      .filter((it): it is RegistryIndexItem => !!it && typeof it.name === 'string')
      .map<SearchResultItem>((it) => ({
        registry,
        name: it.name,
        addCommandArgument: registry === SHADCN_REGISTRY_NAME ? it.name : `${registry}/${it.name}`,
        type: typeof it.type === 'string' ? it.type : undefined,
        description: typeof it.description === 'string' ? it.description : undefined
      }));

    const filtered = query
      ? all.filter(
          (it) =>
            it.name.toLowerCase().includes(query) ||
            (it.description ?? '').toLowerCase().includes(query)
        )
      : all;

    const paged = filtered.slice(offset, offset + limit);

    return jsonResponse({ items: paged, pagination: { total: filtered.length } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return errorResponse(message, 500);
  }
};

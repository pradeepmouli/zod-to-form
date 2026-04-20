/**
 * GET /api/shadcn/search?registry=@shadcn&q=&limit=50&offset=0
 *
 * Fetches the registry's index (e.g., ui.shadcn.com/r/index.json for @shadcn,
 * or <base>/r/index.json for community registries), filters by the query,
 * and returns { items, pagination }.
 */

import {
  CORS_HEADERS,
  SHADCN_REGISTRY_NAME,
  buildIndexUrl,
  errorResponse,
  isValidRegistryName,
  jsonResponse,
  loadRegistries,
  type CommunityRegistry,
  type RegistryIndexItem,
  type SearchResultItem
} from './_shared';

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
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

    let indexUrl: string | null;
    let registryEntry: CommunityRegistry | null = null;

    if (registry === SHADCN_REGISTRY_NAME) {
      indexUrl = buildIndexUrl(SHADCN_REGISTRY_NAME);
    } else {
      const { byName } = await loadRegistries();
      const entry = byName.get(registry);
      if (!entry) {
        return errorResponse(`Unknown registry: ${registry}`, 404);
      }
      registryEntry = entry;
      indexUrl = buildIndexUrl(entry);
    }

    if (!indexUrl) {
      // No reliable index for this registry — return empty so the UI
      // falls through to manual component-name entry.
      return jsonResponse({ items: [], pagination: { total: 0 } });
    }

    const upstream = await fetch(indexUrl, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true }
    });

    if (!upstream.ok) {
      // Treat 404 as "no index" rather than an error.
      if (upstream.status === 404) {
        return jsonResponse({ items: [], pagination: { total: 0 } });
      }
      return errorResponse(`Upstream error: HTTP ${upstream.status}`, 502);
    }

    const raw = (await upstream.json()) as unknown;
    if (!Array.isArray(raw)) {
      return jsonResponse({ items: [], pagination: { total: 0 } });
    }

    const all = (raw as RegistryIndexItem[])
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

    return jsonResponse({
      items: paged,
      pagination: { total: filtered.length }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return errorResponse(message, 500);
  }
};

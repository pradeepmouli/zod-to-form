/**
 * GET /api/shadcn/registries
 *
 * Proxies the shadcn community registries index.
 */

import { CORS_HEADERS, REGISTRIES_URL, errorResponse, jsonResponse } from './_shared';

export const handleRegistriesOptions = (): Response =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const handleRegistries = async (): Promise<Response> => {
  try {
    const upstream = await fetch(REGISTRIES_URL, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true }
    });

    if (!upstream.ok) {
      return errorResponse(`Upstream error: HTTP ${upstream.status}`, 502);
    }

    const data = await upstream.json();
    return jsonResponse(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch registries';
    return errorResponse(message, 500);
  }
};

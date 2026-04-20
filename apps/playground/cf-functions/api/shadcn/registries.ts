/**
 * GET /api/shadcn/registries
 *
 * Cloudflare Pages Function — proxies the shadcn community registries index.
 * Mirrors the Vite dev middleware in apps/playground/vite.config.ts.
 */

import { CORS_HEADERS, REGISTRIES_URL, errorResponse, jsonResponse } from './_shared';

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async () => {
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

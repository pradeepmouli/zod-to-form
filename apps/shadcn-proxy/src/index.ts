/**
 * zod-to-form shadcn-proxy Worker.
 *
 * Bound to zod.toform.dev/api/shadcn/* — proxies shadcn.com's registry APIs
 * behind a same-origin path so the playground can fetch without CORS.
 */

import { CORS_HEADERS } from './_shared';
import { handleRegistries, handleRegistriesOptions } from './registries';
import { handleSearch, handleSearchOptions } from './search';
import { handleResolve, handleResolveOptions } from './resolve';

function notFound(): Response {
  return new Response('Not found', { status: 404, headers: CORS_HEADERS });
}

function methodNotAllowed(): Response {
  return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    const method = request.method;

    switch (pathname) {
      case '/api/shadcn/registries':
        if (method === 'OPTIONS') return handleRegistriesOptions();
        if (method === 'GET') return handleRegistries();
        return methodNotAllowed();

      case '/api/shadcn/search':
        if (method === 'OPTIONS') return handleSearchOptions();
        if (method === 'GET') return handleSearch(request);
        return methodNotAllowed();

      case '/api/shadcn/resolve':
        if (method === 'OPTIONS') return handleResolveOptions();
        if (method === 'POST') return handleResolve(request);
        return methodNotAllowed();

      default:
        return notFound();
    }
  }
} satisfies ExportedHandler;

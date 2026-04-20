/**
 * Minimal ambient types for Cloudflare Pages Functions.
 *
 * When deployed, Cloudflare's build pipeline provides @cloudflare/workers-types
 * and its own PagesFunction typings. These local declarations just let this
 * source tree typecheck standalone without adding a dependency.
 */

declare type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, unknown>;
}) => Response | Promise<Response>;

// Extend RequestInit so CF's `cf` property is accepted.
declare interface RequestInit {
  cf?: {
    cacheTtl?: number;
    cacheEverything?: boolean;
    [k: string]: unknown;
  };
}

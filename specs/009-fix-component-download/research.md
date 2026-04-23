# Phase 0 — Research

## R1: Transport choice

- **Decision**: Client calls same-origin `POST /api/shadcn/resolve` with a `{ items: string[] }` body, consumes `{ files, dependencies, devDependencies, cssVars }` response.
- **Rationale**: `resolve` batches multiple components into one round-trip and recursively follows `registryDependencies` server-side — eliminating N separate client fetches and the (now-broken) per-component JSON shape handling.
- **Alternatives considered**:
  - Per-component `GET /api/shadcn/item/:name`: more round-trips, no benefit over batched `resolve`.
  - Direct `ui.shadcn.com` fetch with a public CORS proxy: third-party dependency, privacy concerns, unreliable.
  - Bundle shadcn sources at build time: snapshots drift from upstream; loses on-demand (US3).

## R2: Prod transport — **standalone Worker**, not Pages Functions

- **Decision**: Deploy a new `apps/shadcn-proxy/` Cloudflare Worker package bound to the Route `zod.toform.dev/api/shadcn/*`. Remove the existing `apps/playground/cf-functions/` directory and the copy-step in `build-combined.mts`.
- **Rationale**: A live probe on 2026-04-23 confirmed the current Pages Functions layout is not serving: `GET /api/shadcn/registries` → 404, `POST /api/shadcn/resolve` → 405 (static-server method rejection). Root cause is that `functions/` under `apps/docs/build/` is not the Pages-project build root, and/or Docusaurus's SPA routing preempts Functions at `/api/*`. A Worker with an explicit Route intercepts requests at the edge before Pages static serving runs, sidesteps the conflict, and gives the proxy an independent deploy pipeline.
- **Alternatives considered**:
  - Fix Pages Functions in place (add `_routes.json`, move `functions/` out of `build/`): feasible but brittle — the same build produces both the static site and the Functions, so any Docusaurus config change risks re-breaking routing.
  - Separate subdomain (`shadcn-proxy.zod.toform.dev`): forces CORS re-enablement on the Worker and makes the client depend on a second hostname; no benefit over same-origin Route.
  - Move the proxy into `@zod-to-form/vite` package: cross-cuts library code with infra; library shouldn't ship Wrangler config.

## R2a: Route binding strategy

- **Decision**: Declare the Route in `wrangler.toml` using `[[routes]]`, so `wrangler deploy` enforces it.
- **Rationale**: Keeps the deploy reproducible from source control. Falls back gracefully if an operator configured the Route manually in the CF dashboard (Wrangler treats identical Routes as idempotent).
- **Alternative considered**: Dashboard-only Route — harder to audit, diverges from infra-as-code.

## R2b: Same-origin URL under `/play/`

- **Decision**: Client always posts to absolute `/api/shadcn/resolve`. The Worker Route matches before the Pages SPA fallback, so this works whether the visitor is on `/`, `/play/`, or any other docs page.
- **Rationale**: Workers Routes match on request URL, not referrer; path is site-root regardless of SPA base.

## R3: Fail-soft semantics

- **Decision**: Treat any non-2xx response or network failure as a soft error. Return `{ sources: cachedOrEmpty, errors: [msg] }` and let the caller (which already exposes an error list to the UI) surface it.
- **Rationale**: Matches spec FR-004 (visible notice, rest of app usable). Existing callers already read `FetchResult.errors`.
- **Alternatives considered**:
  - Throw on failure: would break existing call sites that expect a degraded-but-usable result.
  - Retry with backoff inside the client: out of scope; user-initiated reload already covered by US2.

## R4: Cache key and invalidation

- **Decision**: Keep the existing `z2f-shadcn-registry-cache` localStorage key, bump `CACHE_VERSION` from 1 → 2 when the sources map layout changes due to the proxy migration.
- **Rationale**: Entries saved by the old (direct-fetch) implementation have a slightly different path-derivation and may contain stale content. Bumping the version forces a one-time refresh for existing visitors without a manual cache flush.
- **Alternatives considered**: Keep v1 — risks rendering stale sources that reference the wrong import paths. Introduce per-component TTL — unnecessary for the playground's low churn.

## R5: On-demand (post-initial) fetches (US3)

- **Decision**: Expose `fetchShadcnSources(extra?: string[])` — if `extra` contains components not already in cache, issue a second `resolve` call for just the missing names and merge into cache.
- **Rationale**: Keeps the first-paint request small; demand-loads without a reload.
- **Alternatives considered**: One big pre-fetch of every plausible component — wasteful and slow.

## R6: Local dev correctness

- **Decision**: No changes to `vite.config.ts`. The existing `shadcnRegistryPlugin()` mounts `/api/shadcn/{registries,search,resolve}` for dev; the client call path hits it identically in dev (Vite) and prod (Worker Route).
- **Rationale**: Contributors see behavior that mirrors production without needing Wrangler locally.
- **Note**: Running the Worker locally (e.g. for handler testing) is supported via `wrangler dev` in `apps/shadcn-proxy/` but is not required for playground development.

## R7: Handler migration (cf-functions → Worker)

- **Decision**: Copy `apps/playground/cf-functions/api/shadcn/{_shared,registries,search,resolve}.ts` into `apps/shadcn-proxy/src/`. Replace the per-file `onRequestGet` / `onRequestPost` / `onRequestOptions` exports with a single top-level `export default { fetch(request, env, ctx) }` handler that dispatches by method + pathname.
- **Rationale**: Pages Functions and Workers share the same runtime but differ in dispatch shape. The handler bodies (URL allowlist, registry loading, recursive resolve with depth/visited guards, body-size caps) are identical.
- **Alternative considered**: Keep Pages-Function-style files and use `@cloudflare/kv-asset-handler` or a router shim — adds a dep for zero benefit here.

## Open questions

None. All NEEDS CLARIFICATION resolved.

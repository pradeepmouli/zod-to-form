# Implementation Plan: Fix Component Download on Playground Site

**Branch**: `009-fix-component-download` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-fix-component-download/spec.md`

## Summary

The playground's deployed site breaks shadcn rendering because the client
(`apps/playground/src/lib/shadcn-registry.ts`) fetches
`https://ui.shadcn.com/r/styles/new-york-v4/{name}.json` directly from the
browser — a cross-origin request that the upstream does not CORS-whitelist.

A same-origin Vite middleware already exists for dev, and CF Pages Functions
exist at `apps/playground/cf-functions/api/shadcn/*` — but a live probe
confirms they are **not** being served on zod.toform.dev (`/api/shadcn/registries`
returns 404; POST returns 405 from the static server). Rather than fight
the Pages/Docusaurus static-vs-Functions routing, this plan deploys a
**standalone Cloudflare Worker** bound to a Route on the same origin.

- **Dev**: Vite middleware at `/api/shadcn/{registries,search,resolve}` (unchanged; uses Node-only `shadcn/registry`).
- **Prod**: New `apps/shadcn-proxy/` package — a Workers-runtime script bound to the route `zod.toform.dev/api/shadcn/*`. Reuses the existing Workers-compatible handler code from `cf-functions/api/shadcn/*` (plain `fetch`, no Node built-ins).
- **Client**: rewritten to POST `/api/shadcn/resolve` (same-origin). Works identically in dev (Vite) and prod (Worker Route).

Because Workers with a Route intercept before Pages static serving, this
bypasses the current routing conflict entirely and gives the proxy its own
independent deploy cadence.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Primary Dependencies**:
- Client: React 18+, Vite (playground), browser `fetch` + `localStorage`
- Dev proxy: `shadcn/registry` (Vite middleware, Node-only)
- Prod proxy: **Cloudflare Worker** deployed via Wrangler; bound to a Route on zod.toform.dev; reuses the existing `cf-functions/api/shadcn/*` handler logic (already Workers-compatible)
**Storage**: `localStorage` for 24h visitor-side cache; no server-side state
**Testing**: Vitest unit tests for the client fetch + cache behavior; Worker unit tests via `@cloudflare/vitest-pool-workers` or minimal handler-level tests; manual smoke on the deployed Worker + playground
**Target Platform**: Evergreen browsers; Cloudflare Workers runtime
**Project Type**: Static SPA (playground) + standalone Worker proxy (new package)
**Performance Goals**: First-paint component fetch < 3s on broadband (cold cache); 0 network on warm cache; batched resolve for N components in 1 round-trip
**Constraints**: No Node built-ins in the Worker; no new deps in the playground client; must not break local dev; Worker Route must match `/api/shadcn/*` on zod.toform.dev
**Scale/Scope**: ~7 core components pre-fetched + on-demand resolution within the same session; low request volume

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This feature affects the playground app only — it does not change the
library packages (`core`, `react`, `codegen`, `cli`, `vite`). The
constitutional principles most relevant here:

- **IV. Zero Unnecessary Dependencies**: PASS — fix introduces no new deps; it switches the client from a direct upstream `fetch` to an already-existing same-origin proxy endpoint.
- **VII. Accessibility by Default**: PASS — user story 2 requires a visible failure notice; will use an accessible status region.
- **Test-First Development** (code-style rule): PASS — plan includes unit tests for the new fetch path (happy path, fail-then-retry, cache hit) before wiring.

No violations. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/009-fix-component-download/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-shadcn-resolve.md
├── checklists/
│   └── requirements.md
└── tasks.md               # created by /speckit.tasks
```

### Source Code (repository root)

```text
apps/
├── shadcn-proxy/                       # ← NEW package (pnpm workspace)
│   ├── package.json                    # name: "@zod-to-form/shadcn-proxy" (private)
│   ├── wrangler.toml                   # Worker config: name, route, compat date
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                    # fetch handler — routes /api/shadcn/{registries,search,resolve}
│   │   ├── _shared.ts                  # moved/copied from cf-functions/api/shadcn/_shared.ts
│   │   ├── registries.ts               # handler
│   │   ├── search.ts                   # handler
│   │   └── resolve.ts                  # handler
│   └── tests/
│       └── handlers.test.ts            # ← new: unit tests per handler
├── playground/
│   ├── src/
│   │   └── lib/
│   │       └── shadcn-registry.ts      # ← rewrite to POST /api/shadcn/resolve
│   ├── cf-functions/                   # ← REMOVE (superseded by the Worker)
│   ├── vite.config.ts                  # (unchanged)
│   └── tests/
│       └── shadcn-registry.test.ts     # ← new: unit tests for client fetch + cache
└── docs/
    └── scripts/
        └── build-combined.mts          # ← drop the cf-functions copy step; add a comment pointing at the Worker
```

**Structure Decision**:
- The Worker lives in its own workspace package so it has an independent deploy cadence and `wrangler.toml` doesn't leak into the playground build.
- `_shared.ts` + the three handlers migrate from `cf-functions/` into `apps/shadcn-proxy/src/`. Their logic is already Workers-compatible (plain `fetch`, no Node built-ins) — only the dispatch shell changes (single `fetch()` export instead of per-file `onRequest*` exports).
- Client changes stay limited to `shadcn-registry.ts` + new test file.
- The obsolete `cf-functions/` directory and the copy-step in `build-combined.mts` are removed to avoid confusion about which path actually serves production.

### Deployment wiring

- Worker name: `zod-to-form-shadcn-proxy` (pinned via `wrangler.toml`).
- Route: `zod.toform.dev/api/shadcn/*` (account-level Route — configured once, either via `wrangler.toml` `[[routes]]` or manually in the CF dashboard).
- Deploy: `pnpm --filter @zod-to-form/shadcn-proxy deploy` (alias for `wrangler deploy`).
- CI: new GitHub Actions job runs on push to master when `apps/shadcn-proxy/**` changes; secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` required.

## Complexity Tracking

> No constitutional violations — section intentionally empty.

---

## Phase Outputs

- **Phase 0**: [research.md](./research.md) — transport choice, base-path handling, failure semantics
- **Phase 1**: [data-model.md](./data-model.md), [contracts/api-shadcn-resolve.md](./contracts/api-shadcn-resolve.md), [quickstart.md](./quickstart.md)
- **Phase 2**: tasks.md (produced by `/speckit.tasks`)

# Tasks: Fix Component Download on Playground Site

**Input**: Design documents from `/specs/009-fix-component-download/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-shadcn-resolve.md, quickstart.md

**Tests**: Requested — plan.md calls out Vitest unit tests for both client and Worker handlers.

**Organization**: Tasks grouped by user story for independent delivery.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`, `[US2]`, `[US3]` — see spec.md

---

## Phase 1: Setup

**Purpose**: Scaffold the new `apps/shadcn-proxy/` Worker package and workspace wiring.

- [X] T001 Create directory `apps/shadcn-proxy/` with `src/` and `tests/` subdirs
- [X] T002 Create `apps/shadcn-proxy/package.json` — private pnpm workspace package `@zod-to-form/shadcn-proxy`, devDeps: `wrangler`, `@cloudflare/workers-types`, `typescript`, `vitest`, `@cloudflare/vitest-pool-workers` (optional); scripts: `build`, `deploy` (= `wrangler deploy`), `dev` (= `wrangler dev`), `test` (= `vitest run`), `type-check`
- [X] T003 Create `apps/shadcn-proxy/tsconfig.json` — extends repo root tsconfig; adds `@cloudflare/workers-types` to `types`; `target: es2022`, `module: es2022`, `moduleResolution: bundler`
- [X] T004 Create `apps/shadcn-proxy/wrangler.toml` — `name = "zod-to-form-shadcn-proxy"`, `main = "src/index.ts"`, `compatibility_date`, `[[routes]]` with `pattern = "zod.toform.dev/api/shadcn/*"` + `zone_name = "toform.dev"`
- [X] T005 [P] Add `apps/shadcn-proxy` to `pnpm-workspace.yaml` if `apps/*` glob doesn't already include it; verify `pnpm install` picks it up
- [X] T006 [P] Add `.gitignore` entries for Worker artifacts (`.wrangler/`, `dist/`) in `apps/shadcn-proxy/.gitignore`

---

## Phase 2: Foundational

**Purpose**: Migrate the existing Workers-compatible handler logic from `apps/playground/cf-functions/` into the new Worker package. After this phase, the Worker has a dispatcher, shared helpers, and all three handlers — ready to be wired to any user story.

- [X] T007 Copy `apps/playground/cf-functions/api/shadcn/_shared.ts` → `apps/shadcn-proxy/src/_shared.ts` (no code changes; imports stay same)
- [X] T008 Copy `apps/playground/cf-functions/api/shadcn/registries.ts` → `apps/shadcn-proxy/src/registries.ts` and convert `onRequestGet`/`onRequestOptions` exports into plain functions `handleRegistries(request)` and `handleRegistriesOptions()`
- [X] T009 Copy `apps/playground/cf-functions/api/shadcn/search.ts` → `apps/shadcn-proxy/src/search.ts` and convert exports to `handleSearch(request)` / `handleSearchOptions()`
- [X] T010 Copy `apps/playground/cf-functions/api/shadcn/resolve.ts` → `apps/shadcn-proxy/src/resolve.ts` and convert exports to `handleResolve(request)` / `handleResolveOptions()`
- [X] T011 Create `apps/shadcn-proxy/src/index.ts` — single `export default { fetch(request, env, ctx) }` handler that parses `new URL(request.url).pathname` and dispatches: `/api/shadcn/registries` → `handleRegistries`, `/api/shadcn/search` → `handleSearch`, `/api/shadcn/resolve` → `handleResolve`, OPTIONS for each → corresponding Options handler, anything else → `new Response('Not found', { status: 404 })`
- [X] T012 Delete `apps/playground/cf-functions/` directory (entire tree — superseded by the Worker)
- [X] T013 Remove the cf-functions copy step from `apps/docs/scripts/build-combined.mts` (the block around `functionsTarget`/`cpSync`) and replace with a one-line comment pointing at `apps/shadcn-proxy/`

**Checkpoint**: Worker code compiles; `pnpm --filter @zod-to-form/shadcn-proxy type-check` passes; `wrangler dev` can serve the three routes locally.

---

## Phase 3: User Story 1 — Shadcn Components Load on Deployed Playground (P1) 🎯 MVP

**Goal**: Deployed playground fetches real shadcn components via the Worker proxy and renders them.

**Independent Test**: After Worker deploy + client update, visit `zod.toform.dev/play/` cache-cleaned, confirm `POST /api/shadcn/resolve` returns 200 and the preview renders shadcn-styled controls (see `quickstart.md` prod smoke).

### Tests for User Story 1

- [X] T014 [P] [US1] Write Worker handler test `apps/shadcn-proxy/tests/resolve.test.ts` — mocks `fetch` to return a canned registry payload for `button`, asserts `handleResolve` returns 200 with expected `files` array and CORS headers
- [X] T015 [P] [US1] Write client test `apps/playground/tests/shadcn-registry.test.ts` — cold-cache happy path: mock `fetch('/api/shadcn/resolve')` → 200 with sample `files`, assert `fetchShadcnSources()` returns `sources` with `ui/button` key and writes `{ version: 2, ... }` to localStorage
- [X] T016 [P] [US1] Client test: warm cache — pre-populate localStorage with `version: 2` entry, assert `fetch` is never called and `sources` returned as-is
- [X] T017 [P] [US1] Client test: stale version — pre-populate with `version: 1` entry, assert it's ignored and a fresh fetch is performed

### Implementation for User Story 1

- [X] T018 [US1] Rewrite `apps/playground/src/lib/shadcn-registry.ts` — remove direct `ui.shadcn.com` fetch; replace `fetchComponent()` with a single `POST /api/shadcn/resolve` call that accepts `items: string[]`; map response `files[]` → `sources` using the path-transform from `data-model.md`; bump `CACHE_VERSION` to `2`; preserve public API (`fetchShadcnSources`, `clearShadcnCache`, `FetchResult`)
- [X] T019 [US1] Run `pnpm --filter @zod-to-form/playground test` and ensure all new client tests pass
- [X] T020 [US1] Run `pnpm --filter @zod-to-form/shadcn-proxy test` and ensure Worker handler tests pass
- [X] T021 [US1] Add CI job `.github/workflows/deploy-shadcn-proxy.yml` — triggers on push to master when `apps/shadcn-proxy/**` changes; installs deps, runs type-check + test, runs `wrangler deploy` with `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets
- [X] T022 [US1] Manually (or via wrangler) deploy the Worker: `pnpm --filter @zod-to-form/shadcn-proxy deploy`; verify the Route `zod.toform.dev/api/shadcn/*` appears in the CF dashboard
- [X] T023 [US1] Verify live Route via curl per quickstart.md: `curl https://zod.toform.dev/api/shadcn/registries` → 200 and `curl -X POST ... /api/shadcn/resolve` returns a `files[]` JSON body
- [ ] T024 [US1] Push the client change; after Pages redeploys, load `zod.toform.dev/play/` on a clean profile and confirm the preview renders shadcn-styled controls for at least one bundled example

**Checkpoint**: MVP delivered — real shadcn components render on the live playground.

---

## Phase 4: User Story 2 — Graceful Behavior When Download Fails (P2)

**Goal**: When component downloads fail, the playground shows a visible degraded notice and keeps editor/config/code areas usable.

**Independent Test**: Block `**/api/shadcn/resolve` in DevTools Network, reload the playground; editor and code output still work; a notice is shown; no unhandled console errors.

### Tests for User Story 2

- [X] T025 [P] [US2] Client test: server 5xx — mock `fetch` → `Response('boom', { status: 500 })`, assert `fetchShadcnSources()` returns `{ sources: cachedOrEmpty, errors: ['...'] }` and does NOT throw
- [X] T026 [P] [US2] Client test: network throw — mock `fetch` to reject with `new TypeError('Failed to fetch')`, assert same graceful return shape
- [X] T027 [P] [US2] Playground UI test (Vitest + React Testing Library) — render the shell with a mocked `fetchShadcnSources` returning `errors: ['upstream unavailable']`, assert a visible status region exists with role `status` or `alert` containing the error text

### Implementation for User Story 2

- [X] T028 [US2] In `apps/playground/src/lib/shadcn-registry.ts`, wrap the `fetch` call in try/catch; on non-2xx or network throw, return `{ sources: cachedSources ?? {}, errors: [message] }`
- [X] T029 [US2] Surface `FetchResult.errors` in the playground UI — add an accessible status banner in the component that calls `fetchShadcnSources` (likely `apps/playground/src/hooks/useShadcnComponents.ts` + its consumer in the header or preview pane); banner stays non-blocking and uses `role="status"` with `aria-live="polite"`
- [X] T030 [US2] Run `pnpm --filter @zod-to-form/playground test` — all US2 tests pass

**Checkpoint**: Failure path is visible and non-blocking.

---

## Phase 5: User Story 3 — New Component Types Pulled On-Demand (P3)

**Goal**: Schemas needing components outside the pre-fetched set trigger an in-session fetch without reload.

**Independent Test**: With a warm cache of the 7 core components, paste a schema that requires an extra shadcn component (e.g., `switch` if absent, or a community-registry item); the new control renders styled without a page reload.

### Tests for User Story 3

- [X] T031 [P] [US3] Client test: `fetchShadcnSources(['radio-group'])` with warm cache of core components — assert `fetch` is called exactly once with a body containing only `['radio-group']` (not the already-cached names), and the merged cache now contains both sets
- [X] T032 [P] [US3] Client test: on-demand with some cached + some missing — assert only the missing ones are requested

### Implementation for User Story 3

- [X] T033 [US3] Extend `fetchShadcnSources(extra?: string[])` in `apps/playground/src/lib/shadcn-registry.ts` — if cache has the full core set and `extra` is provided, issue a second POST for just `extra \ cachedNames` and merge results back into cache before returning
- [X] T034 [US3] Wire the on-demand call site — find where the playground discovers that a schema needs a component not in cache (likely in `apps/playground/src/hooks/useShadcnComponents.ts` or `apps/playground/src/lib/component-compiler.ts` when `resolveComponentSlotName` returns a miss) and call `fetchShadcnSources([missingName])`
- [X] T035 [US3] Run `pnpm --filter @zod-to-form/playground test` — US3 tests pass

**Checkpoint**: On-demand component loading works within a session.

---

## Phase 6: Polish

- [X] T036 [P] Update `CLAUDE.md` "Active Technologies" and "Project Structure" sections to list the new `apps/shadcn-proxy/` package
- [X] T037 [P] Add a short README at `apps/shadcn-proxy/README.md` — purpose, deploy command, how to run locally with `wrangler dev`
- [X] T038 [P] Update `apps/playground/README.md` to reference the Worker proxy instead of the removed cf-functions directory
- [X] T039 Run full monorepo type-check: `pnpm run type-check` across all workspaces; fix any fallout
- [X] T040 Run full test suite: `pnpm test`; confirm no regressions

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (P1)**: no deps — start immediately
- **Foundational (P2)**: depends on Setup — needs the package scaffold
- **US1 (P3)**: depends on Foundational — needs the Worker code to deploy
- **US2 (P4)**: depends on US1 (client rewrite must land first so `errors` path exists to test/display)
- **US3 (P5)**: depends on US1 (on-demand extends the rewritten client)
- **Polish (P6)**: after all stories

### Parallel opportunities

- T005 ‖ T006 (different files in same dir, independent)
- T014 ‖ T015 ‖ T016 ‖ T017 (separate test files, independent)
- T025 ‖ T026 ‖ T027 (separate test files)
- T031 ‖ T032 (both in same test file — keep sequential unless split)
- T036 ‖ T037 ‖ T038 (independent docs files)

### User story dependencies

- US1 is the MVP. US2 and US3 are additive refinements that build on US1's client rewrite. Neither US2 nor US3 alone delivers the fix — they sharpen it.

---

## Implementation Strategy

### MVP first (US1 only)

1. Phases 1 + 2: scaffold Worker package and migrate handlers.
2. Phase 3: client rewrite + Worker deploy + live verify.
3. **STOP and VALIDATE**: playground renders shadcn components on zod.toform.dev/play/ cold-cache.

### Incremental delivery

1. Setup + Foundational → Worker scaffolded and handlers migrated.
2. US1 → MVP: component downloads work in prod.
3. US2 → graceful failures + visible notice.
4. US3 → on-demand extras.
5. Polish → docs, full CI green.

### Rollback note

If the Worker deploy fails mid-flight, the client still posts to `/api/shadcn/resolve`. Since the old broken path was also a failed fetch, the playground degrades to the same state it's in today (no components) rather than regressing further — keeping T021/T022 low-risk.

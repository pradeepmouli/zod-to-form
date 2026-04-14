---

description: "Task list for 007-vite-codegen-plugin — @zod-to-form/vite"
---

# Tasks: Vite Plugin for Codegen

**Input**: Design documents from `/specs/007-vite-codegen-plugin/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the project constitution Principle V (Test-First Development) is NON-NEGOTIABLE. Every implementation task is preceded by failing tests.

**Organization**: Tasks are grouped by user story so each story can be delivered as an independent increment.

> **Terminology**: "query-mode" (used in task descriptions and the plugin's source directory naming `src/query-mode/`) and "query-string mode" (used in spec prose for clarity) refer to the same `?z2f`-suffix mechanism. The two spellings are interchangeable throughout the feature artifacts.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This feature adds a new workspace package at `packages/vite/`. Task paths use absolute workspace-relative paths. Core refactor touches `packages/core/` for the `CodegenConfig` move and `canonicalizeConfig` helper.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the `@zod-to-form/vite` workspace package so every later task has a home on disk.

- [X] T001 Create `packages/vite/` directory with `package.json` (name `@zod-to-form/vite`, type `module`, exports map: `.` → `./dist/index.js` with types `./dist/index.d.ts` AND `./client` → `./dist/virtual-types.d.ts` (typings-only entry used by consumers' `tsconfig.json` `types` array), peer deps `vite ^5 || ^6 || ^7`, workspace deps `@zod-to-form/core` and `@zod-to-form/codegen`, direct deps `magic-string` `@babel/parser` `@babel/traverse` `pathe`), matching the monorepo convention. The `./client` export must point at the built .d.ts location so users adding `"types": ["@zod-to-form/vite/client"]` get the `?z2f` import declarations with zero additional configuration.
- [X] T002 [P] Create `packages/vite/tsconfig.json` extending `../../tsconfig.json` with strict mode, composite, references to core and codegen
- [X] T003 [P] Create `packages/vite/tsconfig.build.json` for the `dist` emit
- [X] T004 [P] Create `packages/vite/vitest.config.ts` with the two test environments (Node for unit tests, Vite programmatic API for integration tests)
- [X] T005 [P] Create `packages/vite/README.md` stub pointing at `specs/007-vite-codegen-plugin/quickstart.md`
- [X] T006 Run `pnpm install` at the repo root to link the new workspace package and persist `pnpm-lock.yaml`

**Checkpoint**: `pnpm --filter @zod-to-form/vite run build` must run (and emit nothing meaningful yet) without error. `pnpm -r run type-check` must remain green across the monorepo.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The core refactor (moving `CodegenConfig` to `@zod-to-form/core` and adding `canonicalizeConfig`) plus the shared plugin scaffolding that every user story depends on. No user-story work can begin until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Core refactor — move `CodegenConfig` + add `canonicalizeConfig`

- [X] T007 Write failing unit tests for `canonicalizeConfig` covering: key-order independence, nested objects, arrays of primitives, `undefined` field omission, `null` handling, and numeric stability, in `packages/core/tests/canonicalize-config.test.ts`
- [X] T008 Move the `CodegenConfig` type definition from `packages/codegen/src/generate.ts` into a new file `packages/core/src/config-types.ts`. Export the type from `packages/core/src/index.ts`
- [X] T009 Re-export `CodegenConfig` from `packages/codegen/src/index.ts` as `export type { CodegenConfig } from '@zod-to-form/core'` so existing consumers see no API change
- [X] T010 Implement `canonicalizeConfig(config: CodegenConfig): string` in `packages/core/src/canonicalize-config.ts` — deterministic sort by key, JSON-stringify, no I/O, no deps. Make T007 pass
- [X] T011 Export `canonicalizeConfig` from `packages/core/src/index.ts`
- [X] T012 Verify `pnpm -r run type-check` and `pnpm test` still pass across the monorepo (no breakage to cli or codegen tests from the move)

### Plugin scaffolding

- [X] T013 [P] Create `packages/vite/src/types.ts` with strict interfaces for `PluginOptions`, `GenerationTarget`, `CompilationEntry`, `RewriteSite`, and `HMRInvalidationMap`, matching `data-model.md` exactly
- [X] T014 [P] Create `packages/vite/src/errors.ts` defining all `Z2F_VITE_*` error codes from `contracts/plugin-options.md` as a discriminated union of error classes, each with `code`, `message`, and optional `location`
- [X] T015 [P] Create `packages/vite/src/logger.ts` — a small logger shim honoring `options.logLevel` with `silent / warn / info / debug` levels, independent of Vite's own logger
- [X] T016 Write failing unit tests for `CompilationCache` covering: `get` miss, `set` + `get` roundtrip, `invalidateByFile` surgical eviction, `invalidateAll`, reverse index consistency (`byFile` / `byConfig`), in `packages/vite/tests/unit/cache.test.ts`
- [X] T017 Implement `packages/vite/src/cache.ts` — the `CompilationCache` entity from `data-model.md`. Use `canonicalizeConfig` + Node's `crypto.createHash('sha256')` for cache keys. Make T016 pass
- [X] T018 Create `packages/vite/src/index.ts` exporting a stub `z2fVite(options?: PluginOptions): Plugin` factory that returns a Vite plugin object with `name: '@zod-to-form/vite'` and empty hooks. Tests for the factory signature live with US1

**Checkpoint**: Foundation ready. `@zod-to-form/core` exports `CodegenConfig` and `canonicalizeConfig`; `@zod-to-form/vite` has types, errors, logger, cache, and a no-op plugin export. All tests green. Ready to parallelize US1–US4.

---

## Phase 3: User Story 1 — Zero-config form generation during Vite dev/build (Priority: P1) 🎯 MVP

**Goal**: Query-string mode. `import { Form } from './schemas/signup.ts?z2f'` produces a working generated form at dev time and build time with HMR.

**Independent Test**: Scaffold a minimal Vite + React app with one Zod schema and one `?z2f` import. Run `vite dev`, confirm the form renders. Edit the schema to add a field. Confirm the new field appears in the browser within one second without a full page reload. Then run `vite build` and confirm the generated form is inlined into the production bundle with no `@zod-to-form/*` code present.

### Tests for US1 (TDD — write and fail before implementation)

- [X] T019 [P] [US1] Contract test for `parseSpecifier` covering all rows in `contracts/query-specifier.md` (bare `?z2f`, `?z2f=variant`, `?z2fX` rejection, `?raw` ignored, `?z2f&raw` rejected, invalid variant names rejected) in `packages/vite/tests/contract/parse-specifier.test.ts`
- [X] T020 [P] [US1] Contract test for `PluginOptions` validation covering `configPath` existence check, `write.outDir` inside-root check, unknown keys rejected, every default applied when omitted, in `packages/vite/tests/contract/plugin-options.test.ts`
- [X] T020a [P] [US1] Contract test asserting the plugin does NOT mutate `resolvedConfig.optimizeDeps.include` or `.exclude` (beyond at most one harmless `?z2f` exclude entry), in `packages/vite/tests/contract/optimize-deps.test.ts` — closes FR-014 coverage gap (finding M3)
- [X] T021 [P] [US1] Unit tests for `resolveId` hook — given a source with `?z2f`, returns a stable normalized id; given an unrelated source, returns `null`; given a schema outside Vite root, throws `Z2F_VITE_SCHEMA_OUTSIDE_ROOT`. In `packages/vite/tests/unit/resolve-id.test.ts`
- [X] T022 [P] [US1] Unit tests for `load` hook happy path — given a `?z2f` id, stubs `ssrLoadModule` to return a schema namespace, asserts `generateFormComponent` is invoked with the right config, and the returned source is cached. In `packages/vite/tests/unit/load-query.test.ts`
- [X] T023 [P] [US1] Unit tests for `load` hook error paths — schema not found, wrong export name, non-Zod export (missing `_zod`), unknown variant. Each throws the expected `Z2F_VITE_*` error code. In `packages/vite/tests/unit/load-query-errors.test.ts`
- [X] T023a [P] [US1] Unit test for the ambiguous-export diagnostic path: given a schema module that exports two distinct Zod schemas and no `config.exportName` to disambiguate, assert the plugin throws `Z2F_VITE_AMBIGUOUS_EXPORT` with both candidate names listed. Add the new error code to `packages/vite/src/errors.ts` (T014). In `packages/vite/tests/unit/select-export.test.ts` — closes Edge Case "Schema file with multiple exports" (finding M4)
- [X] T024 [P] [US1] Unit tests for `handleHotUpdate` — given a changed schema file, returns the exact set of virtual module ids that depend on it; given an unrelated file, returns `undefined` to fall through to Vite's default. In `packages/vite/tests/unit/hmr-query.test.ts`
- [X] T025 [P] [US1] Create fixture project `packages/vite/tests/fixtures/query-minimal/` with one schema (`src/schemas/signup.ts`), one app entry (`src/main.tsx`) importing via `?z2f`, a minimal `vite.config.ts` registering `z2fVite()`, and a `package.json` declaring workspace deps
- [X] T026 [US1] Integration test: `packages/vite/tests/integration/query-mode-dev.test.ts` — programmatically create a Vite dev server for the fixture, fetch the `?z2f` module, assert its source contains the generated form JSX, edit the schema file, wait for HMR event, assert the module id appears in the invalidation set (exercises FR-008)
- [X] T027 [US1] Integration test: `packages/vite/tests/integration/query-mode-build.test.ts` — programmatically run `vite build` on the fixture, read the emitted bundle from `dist/`, assert the bundle contains the generated form code, assert the bundle does NOT contain the strings `'@zod-to-form/react'` or `'@zod-to-form/core'` (FR-012)
- [X] T027a [US1] Integration test: `packages/vite/tests/integration/generated-compiles.test.ts` — take the emitted bundle source for every generated form produced by T026/T027, write it to a temp directory alongside an ambient `declarations.d.ts` (mirror `packages/cli/tests/integration/generated-compiles.test.ts`), run `pnpm exec tsgo --noEmit` against it, assert zero diagnostics. Closes **Constitution Principle V sub-clause ("Generated code MUST compile without errors")** — finding C2 CRITICAL
- [X] T027b [US1] Integration test: `packages/vite/tests/integration/surgical-hmr.test.ts` — build a 20-schema fixture, start a dev server, subscribe to Vite's HMR update events, save exactly one schema file, assert only one HMR update event fires (not 20), closing finding H4 (SC-007). Uses a new fixture `packages/vite/tests/fixtures/twenty-schemas/`
- [X] T028 [US1] Integration test: `packages/vite/tests/integration/error-recovery.test.ts` — start dev server, break the schema file mid-session with a syntax error, assert the plugin reports it via the dev server's error collector AND the previously-generated module remains accessible (FR-010, SC-008)
- [X] T028a [US1] Integration test: `packages/vite/tests/integration/hmr-preserves-state.test.ts` — start dev server, render the query-minimal fixture's form through Vitest's browser mode, type a value into one field, edit the schema file to add a NEW field (structure change is additive, not replacing), trigger HMR, assert the pre-existing field's value survives (FR-011, finding H1)
- [X] T028b [US1] Integration test: `packages/vite/tests/integration/ssr-build.test.ts` — run `vite build --ssr` against the query-minimal fixture, load the emitted SSR bundle via dynamic import, call `renderToString` on the form, assert the generated HTML matches the client-build output byte-for-byte. Closes FR-017 (finding H2)
- [X] T028c [US1] Integration test: `packages/vite/tests/integration/cli-coexistence.test.ts` — create a fixture where a project has (a) a committed `Legacy.generated.tsx` produced by the CLI months ago, (b) a `?z2f` import for a different schema handled by the plugin. Run dev AND build; assert the committed file is never touched (FR-007) and the plugin-handled import works. Closes FR-019 (finding H3) and the Edge Case "Plugin used alongside the CLI" (finding M1)

### Implementation for US1

- [X] T029 [P] [US1] Implement `packages/vite/src/query-mode/parse-specifier.ts` — parse `?z2f` and `?z2f=variant` from an import specifier, reject all malformed forms listed in `contracts/query-specifier.md`. Make T019 pass
- [X] T030 [P] [US1] Implement `packages/vite/src/config/load.ts` — `buildEffectiveConfig` (variant merging), `selectExport` (schema export disambiguation), `configHash` (SHA-256 of canonicalized config). The actual `ssrLoadModule` / `this.load` calls live in the plugin hooks (T033, T035) since they need a Vite context.
- [X] T031 [P] [US1] Implement `packages/vite/src/query-mode/resolve-id.ts` — recognize `?z2f` specifiers via `parseSpecifier`, resolve the underlying path through Vite's resolver, return the normalized id `<absolutePath>?z2f[=variant]`. Throws the error types from T014 on invalid inputs. Make T021 pass
- [X] T032 [US1] Implement `packages/vite/src/query-mode/transform.ts` — given a `(schemaFile, variant, config)` triple: load the schema module via `ssrLoadModule` / `this.load`, structurally verify it is Zod v4 (`schema._zod` presence), look up per-variant overrides from `config.variants`, call `walkSchema` + `generateFormComponent`, and return the generated source. Depends on T030. Implemented as the pure helper `compileTarget` — the actual `ssrLoadModule` / `this.load` call lives in `plugin.ts` (T033)
- [X] T033 [US1] Wire the `load` hook in `packages/vite/src/plugin.ts` to call `transform` from T032, using the `CompilationCache` for hits and storing new entries. Emits `generateSchemaLiteFile` output too when the walk produces a lite schema (FR-006 parity with CLI). Make T022 and T023 pass
- [X] T033a [US1] Unit test for the disk-write collision guard: when `PluginOptions.write` is set and a target's emitted path would collide with an existing file that is NOT produced by this plugin run, assert the plugin throws `Z2F_VITE_WOULD_CLOBBER_FILE` and refuses to write. When the existing file IS a product of the current plugin run (same cache key), allow the overwrite. In `packages/vite/tests/unit/write-collision.test.ts` — closes FR-007 (finding M1 residue). Pure helper `checkWriteCollision` in `packages/vite/src/write-guard.ts`; the actual disk write happens in slice 3c / Phase 5
- [X] T034 [US1] Implement `packages/vite/src/hmr.ts` — `handleHotUpdate` hook reading `CompilationCache.byFile` to identify affected virtual module ids and returning them for Vite to invalidate. Make T024 pass. Pure helper `computeHmrInvalidation` + `cacheKeyToModuleId`; the actual `ctx.modules.push(...)` machinery lives in `plugin.ts`
- [X] T035 [US1] Implement `configureServer` hook in `packages/vite/src/plugin.ts` to capture the dev server reference so `config/load.ts` and `query-mode/transform.ts` can call `ssrLoadModule`
- [X] T036 [P] [US1] Create `packages/vite/src/virtual-types.d.ts` — module-augmentation block declaring `*?z2f` and `*?z2f=*` imports. Typed per research R5 (fallback to `unknown` payload for v1)
- [X] T037 [US1] Wire `parse-specifier` + `resolve-id` + `transform` + `load` + `hmr` + `configureServer` into the main `packages/vite/src/plugin.ts` plugin object; export from `packages/vite/src/index.ts`. Make T020 pass
- [X] T038 [US1] Make integration tests T026–T028 pass by exercising the fixture project end-to-end

**Checkpoint**: US1 is fully functional. A user can install `@zod-to-form/vite`, write a `?z2f` import, and get a working form in dev and build with HMR and error recovery. This is the MVP — deploy here if needed.

---

## Phase 4: User Story 2 — Transparent `<ZodForm>` rewrite mode (Priority: P2)

**Goal**: Rewrite mode. Enabling `{ rewriteZodForm: true }` scans source for `<ZodForm schema={X}>` JSX elements and replaces statically-resolvable call sites with generated components. Unresolvable sites are left alone and fall through to the runtime path.

**Independent Test**: Start from an app that uses `<ZodForm schema={signupSchema} onSubmit={fn} />` with no query-string import. Enable rewrite mode. Run `vite build`. Verify the production bundle has no runtime-renderer code for that call site; verify the `<ZodForm>` that references a dynamic schema is left untouched. Source file on disk is unchanged.

### Tests for US2 (TDD — write and fail before implementation)

- [X] T039 [P] [US2] Contract test matrix for the match criteria in `contracts/rewrite-mode.md`: for each row of the "Match criteria" table, assert the scanner accepts/rejects correctly. In `packages/vite/tests/contract/rewrite-matching.test.ts`
- [X] T040 [P] [US2] Unit tests for `scanJsx` — fixtures with `<ZodForm>`, aliased imports, namespaced imports, inline schemas, dynamic schema props, conditional schemas, destructured imports, `node_modules` schemas. Each asserts the scanner's output matches the expected skip / match result. In `packages/vite/tests/unit/scan-jsx.test.ts`
- [X] T041 [P] [US2] Unit tests for `resolveSchema` — binding resolution through `path.scope.getBinding`, import source path validation, inside-root check. In `packages/vite/tests/unit/resolve-schema.test.ts`
- [X] T042 [P] [US2] Unit tests for `rewriteSource` — given a matched `RewriteSite`, assert the `magic-string` edits produce the expected opening-tag replacement, preserve all other props, preserve children, handle self-closing elements, prepend the generated import near existing imports. In `packages/vite/tests/unit/rewrite-source.test.ts`
- [X] T043 [P] [US2] Idempotency test — running the transform twice on the same source produces byte-identical output and sourcemap. In `packages/vite/tests/unit/rewrite-idempotent.test.ts`
- [X] T044 [P] [US2] Create fixture project `packages/vite/tests/fixtures/rewrite-project/` with multiple `<ZodForm>` call sites: one happy path (static local import), one aliased element name, one dynamic schema, one import from `node_modules`, one explicit `?z2f` import coexisting in the same file
- [X] T045 [US2] Integration test: `packages/vite/tests/integration/rewrite-mode-build.test.ts` — programmatically build the rewrite-project fixture with `rewriteZodForm: true`, inspect the emitted bundle to assert (a) the happy-path site produces inlined generated JSX, (b) the dynamic-schema site is left as a runtime `<ZodForm>` call, (c) the DEBUG log summary reports the skipped sites with the expected reasons, (d) the coexisting `?z2f` import path continues to work unchanged

### Implementation for US2

- [X] T046 [P] [US2] Implement `packages/vite/src/rewrite-mode/scan-jsx.ts` — substring fast-path check for `'ZodForm'`, `@babel/parser` parse with `['jsx', 'typescript']` plugins, `@babel/traverse` visitor for `JSXElement` nodes. Returns an array of candidate sites with byte ranges and attribute info. Make T040 pass
- [X] T047 [P] [US2] Implement `packages/vite/src/rewrite-mode/resolve-schema.ts` — given a candidate site, walk the scope chain via `path.scope.getBinding`, validate the import origin is `@zod-to-form/react` for the `ZodForm` identifier AND the schema binding resolves to a file inside the Vite root. Returns a fully-resolved `RewriteSite` or a skip reason. Make T041 pass
- [X] T048 [US2] Implement `packages/vite/src/rewrite-mode/rewrite-source.ts` — apply `magic-string` edits for each resolved `RewriteSite`: replace `ZodForm` with the generated identifier, remove the `schema={X}` attribute, preserve everything else, prepend the `?z2f=__rewrite_N` import near existing imports, emit a hi-res sourcemap. Make T042 and T043 pass
- [X] T049 [US2] Extend `packages/vite/src/plugin.ts` `transform` hook to: gate on `options.rewriteZodForm`, apply the include/exclude glob filter, call `scanJsx` → `resolveSchema` → `rewriteSource`, and register the synthesized `?z2f=__rewrite_N` variants through the same `CompilationCache` used by US1. Make T039 pass
- [X] T050 [P] [US2] Implement the DEBUG logger summary in `packages/vite/src/logger.ts` that accumulates skipped sites during a build and emits a single multi-line report at `buildEnd`. Make the diagnostic assertions in T045 pass
- [X] T051 [US2] Exercise T045 end-to-end against the `rewrite-project` fixture; confirm coexistence with query-mode imports (FR-025)

**Checkpoint**: Both query-string mode and rewrite mode work. Users can opt into transparent upgrade with a single plugin flag.

---

## Phase 5: User Story 3 — Config file watching and shared overrides (Priority: P2)

**Goal**: `z2f.config.ts` is loaded once, applied to every generated form, and re-applied automatically when the config file changes. Variant overrides take precedence over globals as the CLI already handles.

**Independent Test**: Start with a fixture project declaring `ui: 'shadcn'` in `z2f.config.ts`. Confirm the generated form uses shadcn components. Edit the config to `ui: 'html'`. Confirm every affected form rerenders with the new preset within two seconds.

### Tests for US3

- [X] T052 [P] [US3] Unit tests for `config/cache.ts` — `canonicalizeConfig` + SHA-256 wrapper, assert two different configs produce different hashes and two canonically-equal configs produce identical hashes. In `packages/vite/tests/unit/config-cache.test.ts`
- [X] T053 [P] [US3] Unit tests for variant merging — global `{ ui: 'shadcn' }` + variant `{ componentName: 'UserEditForm' }` yields the expected effective config; unknown variant throws `Z2F_VITE_UNKNOWN_VARIANT`. In `packages/vite/tests/unit/variant-merge.test.ts`
- [X] T054 [US3] Create fixture project `packages/vite/tests/fixtures/config-watch/` with a `z2f.config.ts` declaring two variants and a `src/App.tsx` using both `?z2f=edit` and `?z2f=create`
- [X] T055 [US3] Integration test: `packages/vite/tests/integration/config-watch.test.ts` — start dev server, edit the config file, assert HMR invalidates every cached entry within two seconds (FR-009) and the regenerated modules reflect the new config
- [X] T055a [US3] Integration test: `packages/vite/tests/integration/config-error-recovery.test.ts` — start dev server with a valid `z2f.config.ts`, generate a form, then introduce a syntax error in the config file. Assert: (a) dev server does not crash, (b) plugin reports the config error via the dev server's error collector, (c) the previously-valid cached forms still serve correctly, (d) fixing the config file restores normal behavior. Closes Edge Case "Config file with syntax errors" (finding H5) and completes SC-008 coverage

### Implementation for US3

- [X] T056 [US3] Implement `packages/vite/src/config/cache.ts` — wraps `canonicalizeConfig` with SHA-256 via Node's `crypto` module. Make T052 pass
- [X] T057 [US3] Extend `packages/vite/src/config/load.ts` with variant-merging logic matching the `CliConfig` semantics. Make T053 pass
- [X] T058 [US3] Extend `packages/vite/src/hmr.ts` `handleHotUpdate` to recognize the config file path, call `CompilationCache.invalidateAll()`, and return every cached virtual id so Vite can HMR them in one sweep. Make T055 pass
- [X] T059 [US3] Exercise the `config-watch` fixture end-to-end

**Checkpoint**: Config-driven customization works. Users can iterate on their `z2f.config.ts` with HMR feedback.

---

## Phase 6: User Story 4 — Resolver tree-shaking when optimization is enabled (Priority: P3)

**Goal**: When `config.optimization?.level` is set, the plugin strips `@hookform/resolvers/zod` from the production bundle's copy of `useZodForm`, saving ~2KB gzipped.

**Independent Test**: Build the same fixture twice — once with `optimization: { level: 2 }`, once without. Assert the optimized bundle is at least 1.5KB smaller gzipped and contains no `zodResolver` or `@hookform/resolvers` strings.

### Tests for US4

- [X] T060 [P] [US4] Unit tests for `resolver-strip.ts` — given source code representing `useZodForm.js` with the `isOptimized ? undefined : zodResolver(...)` ternary, assert the strip replaces the `zodResolver(...)` half with `undefined` and leaves everything else intact. In `packages/vite/tests/unit/resolver-strip.test.ts`
- [X] T061 [US4] Integration test: `packages/vite/tests/integration/resolver-tree-shake.test.ts` — build the query-minimal fixture twice with `optimization` on/off, read `dist/assets/*.js`, assert the strings `'zodResolver'` and `'@hookform/resolvers'` do NOT appear in the optimized bundle, assert the gzipped byte delta is at least 1.5 KB (SC-004)

### Implementation for US4

- [X] T062 [US4] Implement `packages/vite/src/resolver-strip.ts` — match module ids ending in `useZodForm.js`/`useZodForm.ts`/the resolved `@zod-to-form/react` useZodForm path, check `config.optimization?.level`, apply a `magic-string` edit replacing the `zodResolver(rhfCast(schema))` call with `undefined` within the existing ternary. Emit sourcemap. Make T060 pass
- [X] T063 [US4] Wire `resolver-strip` into `packages/vite/src/plugin.ts`'s `transform` hook as a build-mode-only pass (no-op in dev). Make T061 pass

**Checkpoint**: All four user stories are independently functional. The plugin is feature-complete for v1.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, publishing plumbing, validation against success criteria, benchmark coverage for the new plugin path.

- [ ] T064 [P] Add a `plugin` section to `apps/docs/docs/guides/` with a condensed version of `specs/007-vite-codegen-plugin/quickstart.md`, linked from the docs sidebar
- [ ] T065 [P] Update `apps/docs/src/pages/index.tsx` Architecture section to mention the Vite plugin as a third integration path alongside runtime rendering and CLI codegen
- [ ] T066 [P] Add a changeset entry under `.changeset/` for `@zod-to-form/vite` (new minor release) and for `@zod-to-form/core` (patch: new `canonicalizeConfig` export, `CodegenConfig` type re-homed)
- [ ] T067 [P] Update the root `CLAUDE.md` Active Technologies section to reflect the completed plugin (currently shows "Added TypeScript 5.x with strict mode" placeholder from plan.md)
- [ ] T068 Run `pnpm run type-check` and `pnpm test` across the entire monorepo; assert zero errors, zero failing tests, zero new oxlint warnings in `packages/vite/`
- [ ] T069 Run the quickstart walkthrough (`specs/007-vite-codegen-plugin/quickstart.md`) end-to-end against a fresh Vite + React project created from `pnpm create vite`; time it and confirm under five minutes (SC-001)
- [ ] T070 Measure and record: plugin cold-start overhead on a 20-schema fixture (SC target: ≤500ms), HMR latency on a 50-field schema (SC-002 target: ≤1s), bundle parity between plugin and CLI output (SC-003), resolver-strip byte savings (SC-004). **Additionally assert** (hard-fail the task, not advisory): with rewrite mode enabled on the `medium (18 fields)` fixture, the browser mount-cost reduction vs. runtime baseline is ≥ 40% — closes SC-009 explicit-assertion gap (finding M5). Commit the results to `benchmarks/PLUGIN.md`
- [ ] T070a Codegen parity sweep: for every schema fixture currently exercised by `packages/codegen/tests/generate.test.ts` and `packages/codegen/tests/codegen-optimization.test.ts`, run the same schema through the plugin's `query-mode/transform.ts` and assert the emitted source is byte-equivalent (or AST-equivalent after ignoring formatter noise) to the CLI's output. Failing even one fixture is a blocker per SC-006. In `packages/vite/tests/integration/codegen-parity.test.ts`. **Closes finding C1 (CRITICAL)**
- [ ] T071 Plugin benchmark integration: add `packages/vite` mount and HMR measurements to the root `pnpm run bench:report` pipeline, and add an SC-011 row to the benchmarks report that tracks plugin cold-start overhead alongside the existing codegen-vs-runtime numbers. Scope: plugin-specific benchmarks only — not a rewrite of the existing benchmark harness
- [ ] T072 Smoke-test SC-005 (zero manual `.d.ts` required): open the query-minimal fixture in VS Code, confirm `import { SignupForm } from './schemas/signup.ts?z2f'` resolves with no red squiggles, confirm `onSubmit` parameter autocomplete fires, and then intentionally break the schema file (remove the expected export) — confirm the TypeScript language service shows an inline error in the importing file within 2 seconds, NOT only in the Vite terminal. Closes FR-016 coverage gap (finding M2) together with SC-005

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)** — no dependencies, starts immediately
- **Phase 2 (Foundational)** — depends on Phase 1; **BLOCKS** all user stories
- **Phase 3 (US1, P1 MVP)** — depends on Phase 2; no dependencies on other stories
- **Phase 4 (US2, P2)** — depends on Phase 2; consumes US1's `CompilationCache` + query-mode pipeline via the `__rewrite_N` variant path, so US1 must be largely complete (at least T032–T034) for US2 to integrate cleanly
- **Phase 5 (US3, P2)** — depends on Phase 2; can proceed fully in parallel with US1 and US2 since config-watching touches a different hook path
- **Phase 6 (US4, P3)** — depends on Phase 2; fully independent of US1/US2/US3 — touches only the `resolver-strip.ts` pass on the `useZodForm` module
- **Phase 7 (Polish)** — depends on all desired user stories being complete

### Within each user story

- Tests MUST be written and failing before implementation (Principle V)
- Unit tests can run in parallel with each other [P]
- Integration tests depend on the unit-tested building blocks they exercise
- Multi-file implementation tasks can proceed in parallel when they touch different files [P]

### Parallel opportunities

- **Setup**: T002–T005 are parallel (T001 must land first to create the directory)
- **Foundational**: T007 (tests) runs in parallel with T013–T015 (scaffolding); T008–T011 are strictly sequential; T013–T015 are mutually parallel; T016 (tests) parallel with T013–T015; T017 blocks on T016
- **US1**: T019–T025, T020a, T023a are all parallel test tasks; T029 and T030 can proceed in parallel; T036 runs in parallel with everything else; T031–T035 form a short sequential chain once T029/T030 land; the five new integration tests (T027a, T027b, T028a, T028b, T028c) are sequential after T027/T028 because they share the same dev-server-control harness
- **US2**: T039–T044 are parallel test tasks; T046 and T047 are parallel implementation; T048 depends on both
- **US3**: T052, T053 parallel; T054 independent; T056, T057 parallel; T058 depends on T056/T057; T055a parallel with T055 (different test file)
- **US4**: T060 and T061 independent from everything else; T062 and T063 sequential
- **Polish**: T064–T067 all parallel; T068, T069, T070, T070a, T071, T072 sequential because they share the monorepo test harness and the benchmark artifact file

---

## Parallel Example: User Story 1 foundations

```bash
# After Phase 2 checkpoint, kick off the US1 test suite in parallel:
Task: "T019 [P] [US1] Contract test for parseSpecifier in packages/vite/tests/contract/parse-specifier.test.ts"
Task: "T020 [P] [US1] Contract test for PluginOptions in packages/vite/tests/contract/plugin-options.test.ts"
Task: "T021 [P] [US1] Unit test for resolveId in packages/vite/tests/unit/resolve-id.test.ts"
Task: "T022 [P] [US1] Unit test for load (happy path) in packages/vite/tests/unit/load-query.test.ts"
Task: "T023 [P] [US1] Unit test for load (errors) in packages/vite/tests/unit/load-query-errors.test.ts"
Task: "T024 [P] [US1] Unit test for handleHotUpdate in packages/vite/tests/unit/hmr-query.test.ts"
Task: "T025 [P] [US1] Create fixture project packages/vite/tests/fixtures/query-minimal/"

# Once the tests fail cleanly, start implementation in parallel where possible:
Task: "T029 [P] [US1] Implement parse-specifier.ts"
Task: "T030 [P] [US1] Implement config/load.ts"
Task: "T036 [P] [US1] Create virtual-types.d.ts"
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Complete Phase 1 (Setup) — one or two commits to land the package skeleton
2. Complete Phase 2 (Foundational) — core refactor lands first (T007–T012), then plugin scaffolding (T013–T018)
3. Complete Phase 3 (User Story 1) — test-first, then implementation, then integration tests
4. **STOP AND VALIDATE**: run T068–T070 partial against US1 only, confirm quickstart steps 1–6 work end-to-end
5. Release v0.1.0 of `@zod-to-form/vite` as the MVP — the remaining stories are additive and non-breaking

### Incremental delivery

1. MVP above → `@zod-to-form/vite@0.1.0`
2. Add User Story 3 (config watching) — small, orthogonal → `0.2.0`
3. Add User Story 4 (resolver strip) — small, isolated build-time win → `0.3.0`
4. Add User Story 2 (rewrite mode) — largest story, most risk; ship behind the opt-in flag → `0.4.0`
5. Polish (Phase 7) → `1.0.0`

Note that the priority ordering (P1 → P2 → P2 → P3) in the spec is intentional: US2 and US3 are both P2, but US3 is technically smaller and less risky, so this delivery order ships it earlier. US2 and US3 are fully independent so the order is flexible.

### Parallel team strategy

With multiple developers after Phase 2:

- **Developer A**: US1 (the MVP — must land first)
- **Developer B**: US3 (independent, can land before or during US1 work)
- **Developer C**: US4 (tiny, can land at any point after Phase 2)
- **Developer D**: US2 (starts once US1's cache/transform pipeline lands, ~T034)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete work
- [Story] label maps each task to the spec user story for traceability
- Each user story checkpoint marks a shippable increment
- Principle V: tests must fail before implementation; reviewers should check for a failing-test commit before the implementation commit on each feature slice
- Commit after each logical task group (tests land in one commit, implementation in the next, so blame history matches the TDD cycle)
- Stop at any checkpoint to validate story independence and ship partial value

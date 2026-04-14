# Implementation Plan: Vite Plugin for Codegen

**Branch**: `007-vite-codegen-plugin` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-vite-codegen-plugin/spec.md`

## Summary

A new workspace package `@zod-to-form/vite` exposes a Vite plugin factory that wires the existing `@zod-to-form/codegen` pipeline into Vite's dev server and build hooks. The plugin operates in two complementary modes:

1. **Query-string mode (default)** — transforms imports that carry the `?z2f` suffix into generated form components via Vite's module resolution + `load` hooks, emitting the same source `generateFormComponent` already produces. HMR is driven by the Vite `handleHotUpdate` hook, keyed off the underlying schema file.
2. **Rewrite mode (opt-in)** — scans JSX source files for `<ZodForm schema={X}>` elements where `X` is a statically-resolvable identifier, replaces each matched element with an invocation of a generated component, and leaves unresolvable sites as runtime `<ZodForm>` calls. This mode also applies a build-only transform that strips the `zodResolver` import from `useZodForm` when `optimization.level` is set in the config.

Both modes share a single `CompilationCache` keyed by `(schemaFilePath, configHash, variant)`, invalidated surgically when a schema or config changes so only affected forms regenerate.

The plugin is a thin layer: all actual code generation happens via `generateFormComponent` and `generateSchemaLiteFile` from `@zod-to-form/codegen`, and config loading reuses `loadConfig` from `@zod-to-form/cli`. The plugin contributes (a) Vite lifecycle glue, (b) JSX scanning + rewriting for rewrite mode, (c) the query-string specifier parser, and (d) HMR invalidation logic.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode
**Primary Dependencies**:
- `vite` (peer, ^5.0.0 || ^6.0.0 || ^7.0.0) — plugin API host
- `@zod-to-form/core` (workspace, internal dep) — `walkSchema`, `CodegenConfig` types, and a new `canonicalizeConfig(raw)` helper for cache-key hashing. Config *types* and canonicalization live here; config *file loading* does not.
- `@zod-to-form/codegen` (workspace, internal dep) — emits `.tsx` source strings via `generateFormComponent`
- `zod` (peer, ^4.0.0) — must be resolvable from the user's project for schemas to load
- `magic-string` (direct, ^0.30) — surgical source transformations for rewrite mode
- `@babel/parser` + `@babel/traverse` (direct) — JSX AST scanning for rewrite mode
- `pathe` (direct) — cross-platform path handling matching Vite's own

**NOT a dependency**: `@zod-to-form/cli`. The plugin deliberately does NOT depend on the CLI package. File-loading for both schemas AND the `z2f.config.ts` uses Vite's own `ssrLoadModule` (dev) and programmatic build loader (build) — the same mechanism already chosen for schema loading in research R2. The CLI package stays Node-specific (`jiti`, `commander`, `chokidar`, `prettier`), and the plugin stays free of those transitive deps.

**Required core refactor** (small, scoped to this feature):

1. Move `CodegenConfig` type definition from `@zod-to-form/codegen` to `@zod-to-form/core` (re-exported from codegen for backward compatibility — zero breakage for existing consumers).
2. Add `canonicalizeConfig(config): string` to `@zod-to-form/core` — a pure function that produces the deterministic SHA-256 input used for cache keys. No I/O, no Node APIs, no new deps.
3. Leave `@zod-to-form/cli`'s `loadConfig` in place, unchanged, for the standalone CLI use case. It continues to use `jiti` for file loading. The plugin and CLI each have their own file-loading path appropriate to their runtime.

**Storage**: N/A — plugin is stateless between sessions; in-memory compilation cache only
**Testing**: Vitest for unit tests (query parsing, JSX detection, cache invalidation logic); Vitest + `vite` programmatic API for integration tests (dev server lifecycle, build output, HMR events). A separate e2e fixture project validates acceptance scenarios end-to-end.
**Target Platform**: Node.js 20+ (Vite's minimum); runs during Vite dev server and Vite build. The *emitted* generated code runs in every environment Vite supports (browser ESM, SSR Node, edge runtimes).
**Project Type**: Library / build-tool plugin — ships as a new workspace package `@zod-to-form/vite`
**Performance Goals**:
- Initial schema compile (cold): ≤ 150ms per schema on medium (18-field) fixture
- HMR update latency (schema save → browser DOM change): ≤ 1000ms on large (50-field) fixture
- Config-file change regeneration fan-out: ≤ 2000ms for ≥ 20 affected forms
- Cold dev startup overhead added by the plugin: ≤ 500ms for 20 schemas (measured against bare `vite dev`)

> **Fixture size terminology**: "small (5 fields)", "medium (18 fields)", "large (50 fields)" throughout this plan refer to the same fixture shapes defined in `packages/react/tests/performance/schemas.ts` and documented in `benchmarks/RESULTS.md`. The plugin's benchmark suite reuses these fixtures so performance numbers are directly comparable to the existing runtime vs. codegen measurements.

**Constraints**:
- No writes to the project source tree by default (virtual-module-first)
- Must not clobber committed `*.generated.tsx` files
- Must not require the developer to disable Vite's dep optimizer
- Must work in both `vite dev` (SSR-capable) and `vite build` (browser + SSR)
- Must not pull Node-only APIs into the emitted generated code (the generated code stays browser-safe; only the plugin runtime itself uses Node)

**Scale/Scope**:
- Expected per project: 1–50 generated forms, 1–20 schema files, one `z2f.config.ts`
- Code footprint target: plugin package ≤ 2000 LOC including tests
- Zero runtime cost in production bundles — the plugin does not ship any code to the user's site

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Verdict | Notes |
|---|---|---|---|
| I | Zod-Native Architecture | **PASS** | Plugin does not introspect schemas directly. It delegates to `generateFormComponent`, which already honors Zod v4's `_zod.def` / `_zod.bag` substrate. The plugin only parses *import specifiers* and *JSX*, not schema internals. |
| II | Processor Registry Pattern | **PASS** | Plugin does not add or bypass the walker. It calls `walkSchema` (via the existing codegen entry point) whose registry stays unchanged. |
| III | Dual-Mode Output | **PASS** | Plugin is a third *mechanism* that produces the same `FormField[] → .tsx` codegen output as the CLI. The core walker and processor registry are unchanged. Runtime mode continues to exist for rapid iteration; the plugin automates the runtime→codegen transition (Story 2). |
| IV | Zero Unnecessary Dependencies | **CONDITIONAL PASS** | New direct deps: `magic-string`, `@babel/parser`, `@babel/traverse`, `pathe`. Each is justified in the "Dependency justification" table below. `vite` is a peer. The plugin adds zero runtime dependencies to the user's emitted bundle. |
| V | Test-First Development | **PASS (commitment)** | Planned test coverage: contract tests for plugin-options shape; unit tests for query parsing, JSX scanning, cache keying, HMR invalidation math; integration tests using the programmatic Vite API that assert FR-008, FR-009, FR-010, FR-012, FR-013 end-to-end; and a fixture project exercising every acceptance scenario. Red/green cycle enforced per task. |
| VI | Type Safety First | **PASS** | Plugin options are fully typed; virtual-module imports are typed via `.d.ts` shim shipped in the package root (auto-included by `tsconfig.json`'s default `include`). No `any`, no unjustified `as` casts. |
| VII | Accessibility by Default | **PASS (delegated)** | Accessibility lives in the generated JSX, not the plugin. The plugin passes through whatever `generateFormComponent` already produces — which satisfies Principle VII today. |

### Dependency justification (Principle IV)

| Dependency | Type | Size (gzipped) | Why needed | Simpler alternative considered |
|---|---|---|---|---|
| `magic-string` | direct | ~2KB | Surgical source-code edits with accurate sourcemaps for rewrite mode. Vite itself depends on it, so it's already in every Vite project's graph — zero marginal install cost. | String splicing by hand: rejected because source-map correctness is non-negotiable for IDE-friendly errors (FR-010, FR-016). |
| `@babel/parser` | direct | ~35KB | Parse TSX source to find `<ZodForm>` JSX elements and resolve the `schema={X}` identifier. Vite already depends on `@babel/*` for React plugin ecosystems, so not a new runtime cost for most projects. | Regex-based scanning: rejected because JSX inside template strings, comments, and conditionals makes regex unsound and produces silent miscompilations. |
| `@babel/traverse` | direct | ~17KB | Walk the AST produced by `@babel/parser` with scope tracking so we can resolve imported identifiers safely. | Hand-written recursive walker: rejected because scope tracking (handling `const` shadowing, import aliases) is ~300 LOC of error-prone code. |
| `pathe` | direct | ~2KB | Path handling that matches Vite's own normalized-POSIX convention across Windows, macOS, Linux. | Node's `path` module: rejected because Windows path mismatches are a known source of plugin HMR bugs (Vite's own guidance is to use `pathe`). |

Total new direct dependencies: 4, all already present in the dep graph of the vast majority of Vite + React projects. None ship to the user's bundle.

### Gates

- [x] Principle I/II/III unaffected — no walker or processor changes
- [x] Principle IV addressed — four direct deps, each justified and already-transitive in typical Vite projects
- [x] Principle V committed — test plan defined in Summary and will be enforced in `tasks.md`
- [x] Principle VI preserved — plugin options fully typed, virtual-module typing via `.d.ts` shim
- [x] Principle VII preserved — accessibility is downstream in generated JSX
- [x] No committed-file clobbering (FR-007)
- [x] Coexistence with CLI (FR-019)

**Gate result: PASS.** Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/007-vite-codegen-plugin/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── plugin-options.md
│   ├── query-specifier.md
│   └── rewrite-mode.md
├── checklists/
│   └── requirements.md  # Created by /speckit.specify
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

This feature adds a new workspace package. No changes to `packages/core`, `packages/react`, or the existing `packages/cli` are expected beyond possibly exposing `loadConfig` as a stable export.

```text
packages/
├── core/                              # unchanged
├── codegen/                           # unchanged; consumed via generateFormComponent
├── react/                             # unchanged; plugin targets <ZodForm> references here
├── cli/                               # may expose loadConfig as a public entry
└── vite/                              # NEW: @zod-to-form/vite
    ├── src/
    │   ├── index.ts                   # public plugin factory export
    │   ├── plugin.ts                  # Vite plugin object (resolveId, load, transform, handleHotUpdate)
    │   ├── query-mode/
    │   │   ├── parse-specifier.ts     # "./foo.ts?z2f" and "./foo.ts?z2f=edit" parsing
    │   │   └── transform.ts           # build the generated module source for a (schema, variant) pair
    │   ├── rewrite-mode/
    │   │   ├── scan-jsx.ts            # @babel/parser + traverse → rewrite sites
    │   │   ├── resolve-schema.ts      # "is this identifier statically resolvable?"
    │   │   └── rewrite-source.ts      # magic-string edits + sourcemap output
    │   ├── resolver-strip.ts          # strip `@hookform/resolvers/zod` when optimization is on (FR-013)
    │   ├── config/
    │   │   ├── load.ts                # wraps cli's loadConfig + adds Vite-specific watch integration
    │   │   └── cache.ts               # config hash for CompilationCache keys
    │   ├── cache.ts                   # CompilationCache: Map<(schemaPath, variant, configHash), GeneratedOutput>
    │   ├── hmr.ts                     # handleHotUpdate logic — which importers to invalidate
    │   ├── types.ts                   # PluginOptions, GenerationTarget, RewriteSite, etc.
    │   └── virtual-types.d.ts         # module augmentation for '*.ts?z2f' imports
    ├── tests/
    │   ├── contract/
    │   │   ├── plugin-options.test.ts
    │   │   ├── query-specifier.test.ts
    │   │   └── rewrite-matching.test.ts
    │   ├── unit/
    │   │   ├── parse-specifier.test.ts
    │   │   ├── scan-jsx.test.ts
    │   │   ├── resolve-schema.test.ts
    │   │   ├── cache.test.ts
    │   │   ├── hmr.test.ts
    │   │   └── resolver-strip.test.ts
    │   ├── integration/
    │   │   ├── query-mode-dev.test.ts      # programmatic createServer, validate FR-008
    │   │   ├── query-mode-build.test.ts    # programmatic build, validate FR-012
    │   │   ├── rewrite-mode-build.test.ts  # validate FR-020, FR-021, FR-022
    │   │   ├── config-watch.test.ts        # validate FR-009
    │   │   ├── error-recovery.test.ts      # validate FR-010, SC-008
    │   │   └── cli-coexistence.test.ts     # validate FR-019
    │   └── fixtures/
    │       ├── small-project/              # minimal Vite + React + one schema
    │       ├── medium-project/             # multi-schema + config file
    │       └── rewrite-project/            # uses <ZodForm> + rewrite mode
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.build.json
    └── README.md
```

**Structure Decision**: New workspace package at `packages/vite/` named `@zod-to-form/vite`. This keeps dependency discipline intact — `packages/core`, `packages/codegen`, and `packages/react` remain untouched and free of Vite/Babel/magic-string dependencies. The plugin package is additive: users who don't need Vite integration pay zero cost, and the dep graph for the existing publish pipeline is unchanged.

## Complexity Tracking

No unjustified violations. One item worth noting for transparency:

| Item | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| JSX AST scanning in rewrite mode | Required by FR-020 to find `<ZodForm>` call sites reliably across TS/TSX files with comments, template strings, and conditionals. | Regex scanning: rejected in the dependency justification table above. Leaving rewrite mode out of v1: rejected because Story 2 is P2, expected by the user, and solves a real DX problem. |

**Resolved during Phase 1 redesign (not a complexity item any more):** An earlier draft had the plugin depending on `@zod-to-form/cli` to reuse `loadConfig`. That pulled `jiti`/`commander`/`chokidar`/`prettier` into the plugin's transitive dep graph. The cleaner path — adopted — is to (a) move the `CodegenConfig` type and a new `canonicalizeConfig` helper into `@zod-to-form/core`, and (b) have the plugin load `z2f.config.ts` via Vite's own `ssrLoadModule`, exactly the same mechanism it already needs for schema loading. The plugin has zero dependency on `@zod-to-form/cli`, `@zod-to-form/core` gains one pure-TypeScript function with no new dependencies (Principle IV preserved), and the CLI's standalone `loadConfig` is untouched.

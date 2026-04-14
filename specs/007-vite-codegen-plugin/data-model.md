# Data Model — Vite Plugin for Codegen

**Branch**: `007-vite-codegen-plugin`
**Date**: 2026-04-14

This document formalizes the entities the plugin tracks during a single dev session or build, their attributes, and their lifecycle. The plugin persists none of these across sessions; all state is in-memory and rebuilt on each `createServer` / `build` invocation.

---

## Entities

### 1. `PluginOptions`

User-provided plugin configuration, passed to the factory function.

| Field | Type | Default | Notes |
|---|---|---|---|
| `configPath` | `string \| undefined` | auto-discover | Path to `z2f.config.ts`. If undefined, walks up from the Vite `root` looking for `z2f.config.{ts,js,mjs}`. |
| `configOverride` | `Partial<Z2FConfig> \| undefined` | `undefined` | Shallow override merged on top of the loaded config. Useful for CI or multi-mode builds. |
| `rewriteZodForm` | `boolean` | `false` | FR-024: rewrite mode is OFF by default. When true, enables JSX scanning and `<ZodForm>` replacement. |
| `rewriteInclude` | `string[] \| undefined` | `['**/*.{ts,tsx,js,jsx}']` | Glob patterns for files the rewrite scanner should consider. Only consulted when `rewriteZodForm` is true. |
| `rewriteExclude` | `string[] \| undefined` | `['**/node_modules/**', '**/dist/**']` | Glob exclusions for the rewrite scanner. Always includes `node_modules` regardless of user setting (safety). |
| `write` | `WriteOptions \| undefined` | `undefined` (virtual only) | Optional opt-in to emit generated files to disk. When set, the plugin writes `*.generated.tsx` alongside the schema file or into `write.outDir`. |
| `logLevel` | `'silent' \| 'warn' \| 'info' \| 'debug'` | `'info'` | Controls plugin-specific logging. Independent of Vite's own log level. |

**Validation**:

- `configPath`, if provided, MUST resolve to an existing file at plugin registration time; otherwise throw with a clear error.
- `rewriteInclude` / `rewriteExclude` are only consulted when `rewriteZodForm` is true; providing them with rewrite disabled is a warning, not an error.
- `write.outDir`, if provided, MUST be inside the Vite `root`; otherwise refuse with a clear error (prevents accidentally writing to system paths).

**Lifecycle**: Constructed once when the user calls `z2fVite(options)`. Immutable for the life of the plugin instance.

---

### 2. `GenerationTarget`

A single `(schema, variant, config)` triple that produces exactly one generated form. The cache key space.

| Field | Type | Notes |
|---|---|---|
| `schemaFile` | `string` | Absolute, normalized path to the schema source file. Identity. |
| `exportName` | `string` | The named export to pick from the schema module (e.g., `'signupSchema'`). Default: the first export whose `_zod` matches. |
| `variant` | `string` | Variant name from the `?z2f=<variant>` query, or `''` for the default variant. Rewrite-mode variants use the `__rewrite_<n>` prefix. |
| `configHash` | `string` | SHA-256 of the serialized effective config (global + per-variant). Changes invalidate the cache. |
| `componentName` | `string` | Derived from `exportName` + variant (e.g., `SignupForm`, `SignupEditForm`). Used as the exported React component name. |
| `sourceKind` | `'query' \| 'rewrite'` | How this target was introduced. `'query'` means an explicit `?z2f` import; `'rewrite'` means JSX scanner found a `<ZodForm>` call site. |

**Validation**:

- `schemaFile` MUST be an absolute path and MUST be inside the Vite `root` (schemas in `node_modules` are rejected with a clear error unless `rewriteZodForm` is false, in which case they can't be reached anyway because no `?z2f` import will be written for them).
- `exportName` MUST exist on the schema module namespace after dynamic load, and the value at that export MUST have a `_zod` property (structural Zod-v4 check).
- `configHash` MUST be recomputed from the canonical serialization of the resolved config, not from any intermediate form. Two targets with equal configs MUST produce equal hashes.
- `componentName` MUST be a valid JavaScript identifier. If the derived name collides with a reserved word or a JSX built-in, append a numeric suffix.

**Lifecycle**:

1. **Created** during `resolveId` (query mode) or `transform` (rewrite mode) when the plugin first encounters the target.
2. **Compiled** during `load` → `generateFormComponent` call.
3. **Cached** in the `CompilationCache` keyed by `(schemaFile, variant, configHash)`.
4. **Invalidated** when any of the following change: the schema file content, the config file content, or the plugin options. Invalidation evicts the cache entry; next `load` recompiles.
5. **Destroyed** when the Vite dev server closes or the build finishes.

---

### 3. `CompilationCache`

The in-memory map of already-compiled generation targets.

| Field | Type | Notes |
|---|---|---|
| `entries` | `Map<string, CompilationEntry>` | Keyed by `${schemaFile}::${variant}::${configHash}`. |
| `byFile` | `Map<string, Set<string>>` | Reverse index: for each watched schema file, the set of cache keys that depend on it. Enables O(1) lookup during `handleHotUpdate`. |
| `byConfig` | `Set<string>` | All cache keys that depend on the config (which is all of them, but kept explicit for clarity). |

Where `CompilationEntry` is:

| Field | Type | Notes |
|---|---|---|
| `target` | `GenerationTarget` | The triple that produced this entry. |
| `generatedSource` | `string` | The `.tsx` source emitted by `generateFormComponent`. |
| `schemaLiteSource` | `string \| null` | The companion `.lite.ts` source emitted by `generateSchemaLiteFile`, or `null` if there are no top-level effects. |
| `sourceMap` | `unknown` | Placeholder for a future sourcemap back to the original schema file. `null` in v1. |
| `emittedAt` | `number` | `Date.now()` at compile time. Used for debug logging and HMR ordering. |

**Operations**:

- `get(key)` — return the entry or `undefined`.
- `set(key, entry)` — store the entry, update `byFile` and `byConfig` indexes.
- `invalidateByFile(schemaFile)` — look up via `byFile[schemaFile]`, evict every matching entry from `entries` and from `byFile`/`byConfig`. Return the list of evicted keys so `handleHotUpdate` knows what to tell Vite.
- `invalidateAll()` — called when the config file changes. Evicts everything and returns the complete key list.
- `stats()` — size + hit/miss counters for debug logging.

**Concurrency**: The cache is single-threaded (Vite runs plugins sequentially on the main event loop). No locking is needed.

---

### 4. `RewriteSite`

A single `<ZodForm>` JSX element that rewrite mode has matched and will replace.

| Field | Type | Notes |
|---|---|---|
| `sourceFile` | `string` | Absolute path to the `.tsx` / `.jsx` / `.ts` / `.js` file containing the rewrite. |
| `range` | `{ start: number; end: number }` | Byte offsets of the original `<ZodForm>` element in the source file. |
| `schemaFile` | `string` | Absolute path to the schema file the `schema={X}` identifier resolves to. |
| `exportName` | `string` | The export name of the identifier in the schema module. |
| `generatedIdentifier` | `string` | The local name that replaces `ZodForm` at this call site (e.g., `_GeneratedForm_1`). Unique within the source file. |
| `variant` | `string` | Always `__rewrite_<n>` where `<n>` is a per-source-file counter. Keeps rewrite-mode variants from colliding with user-declared variants. |

**Validation**:

- `range.start` < `range.end`, and both within the source file's byte length.
- `schemaFile` MUST resolve to a file inside the Vite `root` (never `node_modules`). FR-021.
- `generatedIdentifier` MUST be a valid JS identifier and MUST NOT collide with any existing identifier in the source file's scope.

**Lifecycle**:

1. **Created** during `transform` when `scan-jsx.ts` finds a matching element and `resolve-schema.ts` confirms the identifier is statically resolvable.
2. **Consumed immediately** by `rewrite-source.ts`, which writes the replacement edit into a `MagicString` instance and records the corresponding `GenerationTarget` in the `CompilationCache`.
3. **Not persisted** — rewrite sites exist only during a single `transform` call. Subsequent HMR of the same source file re-parses and re-identifies sites from scratch.

---

### 5. `HMRInvalidationMap`

The graph edges that `handleHotUpdate` walks when a watched file changes.

| Field | Type | Notes |
|---|---|---|
| `schemaToTargets` | `Map<schemaFile, Set<cacheKey>>` | Same as `CompilationCache.byFile`; referenced here for clarity. |
| `schemaToImporters` | `Map<schemaFile, Set<moduleId>>` | For each schema file, the set of Vite module ids (including `?z2f` virtual modules) that import it directly. |
| `targetToImporters` | `Map<cacheKey, Set<moduleId>>` | For each cache entry, the set of modules that import its virtual id. (In practice: the user's source file that wrote the `?z2f` import, or the rewrite-transformed source file.) |
| `configWatchers` | `Set<moduleId>` | All modules that depend on the config, for config-change fan-out. |

**Operations**:

- `onSchemaFileChanged(file)` — return the list of module ids that Vite should invalidate. Computed as `targetToImporters[cacheKey]` for every key in `schemaToTargets[file]`, plus the schema file itself (so direct consumers of the schema module reload normally).
- `onConfigFileChanged()` — return every module id in `configWatchers`. Triggers full regeneration of every cached target.

**Lifecycle**: Rebuilt incrementally as the plugin sees `resolveId` / `load` / `transform` calls. Reset on dev server restart.

---

### 6. `CodegenConfig` (imported from `@zod-to-form/core`)

The plugin does NOT define this type. As part of this feature, the `CodegenConfig` type definition moves from `@zod-to-form/codegen` to `@zod-to-form/core` (with a backward-compatible re-export from codegen). The Vite plugin imports it from core directly, which keeps the plugin's dep graph clean of CLI-only dependencies.

`@zod-to-form/core` also gains a pure-TypeScript helper:

```ts
export function canonicalizeConfig(config: CodegenConfig): string;
```

This function produces a deterministic string representation of a `CodegenConfig` that is used as the input to `configHash` (SHA-256) on each `GenerationTarget`. It is pure, has no I/O, has no dependencies, and is portable across Node and browser environments.

The plugin extends the config shape with one optional field for variants:

| Field | Type | Notes |
|---|---|---|
| `variants` | `Record<string, Partial<CodegenConfig>>` | Per-variant overrides keyed by the `?z2f=<name>` value. Optional. |

This lets users write `?z2f=edit` in source and have the `edit` variant's config merged on top of the global config for that target. If the variant name is unknown, the plugin reports a clear error rather than silently falling back.

**Config file loading is NOT part of `@zod-to-form/core`**. Core exposes only the type and the canonicalization helper. Actual loading of `z2f.config.ts` is the caller's responsibility:

- The Vite plugin loads via `server.ssrLoadModule` (dev) / `this.load` (build) — see research R2.
- The CLI continues to use its existing `jiti`-based `loadConfig` — unchanged by this feature.

This split keeps core zero-dep (Principle IV) while letting each consumer pick the loader appropriate to its runtime.

---

## Relationships

```
PluginOptions
    │
    └── loads / validates ──▶ Z2FConfig (from disk)
                                    │
                                    └── drives ──▶ GenerationTarget (one per compiled form)
                                                        │
                                                        ├── stored in ──▶ CompilationCache
                                                        │                        │
                                                        │                        └── indexed by ──▶ HMRInvalidationMap
                                                        │
                                                        └── may originate from ──▶ RewriteSite
                                                                                        │
                                                                                        └── lives in ──▶ source .tsx file
```

All five plugin-owned entities (`PluginOptions`, `GenerationTarget`, `CompilationCache`, `RewriteSite`, `HMRInvalidationMap`) live in the plugin runtime. `Z2FConfig` is external — the plugin reads it but does not own its shape.

---

## Validation rules summary

| Rule | Source | Enforcement |
|---|---|---|
| Schema files must live inside the Vite root | FR-021, edge cases | `resolveId` and `resolve-schema.ts` |
| `?z2f` variants must match `config.variants` keys | Spec clarifications | `load` — throws with clear error on unknown variant |
| Rewrite sites must resolve statically | FR-020, FR-021, FR-022 | `scan-jsx.ts` + `resolve-schema.ts` — non-resolvable sites are skipped with a DEBUG diagnostic |
| Cache keys must be deterministic for equal inputs | R1, R4 | `configHash` is SHA-256 of canonicalized config; `schemaFile` is absolute + normalized via `pathe` |
| Generated component names must be valid JS identifiers | FR-015 | `componentName` derivation in `GenerationTarget` construction |
| Committed `*.generated.tsx` files must not be clobbered | FR-007 | `write.outDir` validation + refusal to write if a target's emitted path collides with a tracked (non-gitignored) file |

---

## State transitions

The only explicit state machine is `CompilationEntry`:

```
(new)
  │
  │  load(?z2f id) → generateFormComponent
  ▼
[compiled] ────────────┐
  │                    │
  │                    │ schema file changed → invalidateByFile
  │                    ▼
  │                 [evicted] ──▶ (next load recompiles) ──▶ [compiled]
  │
  │ config file changed → invalidateAll
  ▼
[evicted]
```

All other entities are acyclic and have trivial lifecycles (construct → use → destroy on session end).

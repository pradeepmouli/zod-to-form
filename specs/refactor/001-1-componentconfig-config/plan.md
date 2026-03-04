# Implementation Plan: Unified ZodFormsConfig Refactoring

**Branch**: `refactor/001-1-componentconfig-config` | **Date**: 2026-03-04 | **Spec**: [refactor-spec.md](./spec.md)
**Input**: Refactor specification from `/specs/refactor/001-1-componentconfig-config/spec.md`

## Summary

Unify `ZodToFormComponentConfig`, `FormMeta` field-level properties, CLI generation flags, and `RuntimeComponentConfig` into a single `ZodFormsConfig<TComponents, TSchemas>` type. Introduce per-schema (`zodType`) configuration via a `schemas` section with type-safe keys, align `FieldConfig` with `FormMeta` (minus `render`), add CLI defaults in config, and print autodiscovery/generation results as styled lists.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), commander, jiti, prettier, chokidar (CLI direct)
**Storage**: N/A (library/CLI tool, no persistence)
**Testing**: Vitest
**Target Platform**: Node.js (CLI), Browser (React runtime)
**Project Type**: Library (monorepo: core, react, cli)
**Performance Goals**: No regression from current build/bundle/runtime
**Constraints**: Zero unnecessary dependencies (Constitution Principle IV), TypeScript strict mode (Principle VI)
**Scale/Scope**: ~15 files modified across 3 packages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Zod-Native Architecture | PASS | No schema representation changes. Config types are orthogonal to Zod introspection. |
| II. Processor Registry Pattern | PASS | Processors unchanged. Config refactoring doesn't touch walker or processors. |
| III. Dual-Mode Output | PASS | Both runtime and codegen share same `FormField[]` IR. Config just controls generation parameters. |
| IV. Zero Unnecessary Dependencies | PASS | No new dependencies added. |
| V. Test-First Development | PASS | Existing tests for `validateComponentConfig`, `defineComponentConfig`, loader, codegen, init. Will add tests for new config shape before refactoring. |
| VI. Type Safety First | PASS | New generics `<TComponents, TSchemas>` improve type safety. No `any` or `as` casts. |
| VII. Accessibility by Default | PASS | Config changes don't affect rendered accessibility attributes. |

**Gate Result**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/refactor/001-1-componentconfig-config/
├── spec.md              # Refactor spec (symlink → refactor-spec.md)
├── refactor-spec.md     # Refactor specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output — type hierarchy
├── quickstart.md        # Phase 1 output — migration guide
├── contracts/
│   └── public-api.md    # Phase 1 output — API contract
├── testing-gaps.md      # Pre-baseline testing assessment
├── behavioral-snapshot.md # Behavior preservation checklist
├── metrics-before.md    # Baseline metrics
└── metrics-after.md     # Post-refactor metrics
```

### Source Code (affected files)

```text
packages/
├── core/
│   └── src/
│       ├── config.ts            # NEW — renamed from component-config.ts
│       ├── component-config.ts  # DELETED — renamed to config.ts
│       ├── types.ts             # MODIFIED — FormMeta extends FieldConfig
│       ├── metadata.ts          # MODIFIED — minor import update
│       └── index.ts             # MODIFIED — update re-exports
├── cli/
│   └── src/
│       ├── index.ts             # MODIFIED — use config defaults, print results
│       ├── loader.ts            # MODIFIED — rename functions, backward compat
│       └── init.ts              # MODIFIED — print autodiscovery results
└── react/
    └── src/
        ├── ZodForm.tsx          # MODIFIED — update prop types
        ├── FieldRenderer.tsx    # MODIFIED — derive RuntimeComponentConfig from core
        └── index.ts             # MODIFIED — update re-exports

packages/
├── core/tests/
│   └── component-config.test.ts # MODIFIED — rename to config.test.ts, add new shape tests
├── cli/tests/
│   ├── loader.test.ts           # MODIFIED — update function names
│   └── init.test.ts             # MODIFIED — verify styled list output
└── react/tests/                 # MINIMAL — structural types only
```

**Structure Decision**: Existing pnpm workspace monorepo structure. No new packages or directories needed.

## Implementation Phases

### Phase 1: Core Type Refactoring (packages/core)

**Step 1.1**: Create `FieldConfig` type and update `FormMeta`

File: `packages/core/src/types.ts`

```typescript
// NEW: Serializable field configuration
export interface FieldConfig {
  fieldType?: string;
  order?: number;
  hidden?: boolean;
  gridColumn?: string;
  props?: Record<string, unknown>;
}

// MODIFIED: FormMeta extends FieldConfig, adds runtime-only render
export interface FormMeta extends FieldConfig {
  render?: (field: FormField, props: unknown) => unknown;
}
```

**Step 1.2**: Create `config.ts` with new types

File: `packages/core/src/config.ts` (new file, content migrated from `component-config.ts`)

New types to add:
- `ConfigDefaults` — `{ mode?, ui?, out?, overwrite?, serverAction? }`
- `ZodTypeConfig<T>` — `{ name?, mode?, out?, serverAction?, fields? }`
- `ZodFormsConfig<TComponents, TSchemas>` — unified config with `defaults`, `schemas`, `fields`
- `defineConfig<T, S>()` — identity function for type inference
- `validateConfig()` — updated validation accepting new + old shapes

Deprecated aliases to add:
- `ZodToFormComponentConfig` → `ZodFormsConfig` (type alias with `@deprecated`)
- `FieldOverride` → `FieldConfig` (type alias with `@deprecated`)
- `defineComponentConfig` → calls `defineConfig` (wrapper with `@deprecated`)
- `validateComponentConfig` → calls `validateConfig` (wrapper with `@deprecated`)

Keep: `ComponentEntry<T>`, `FormPrimitivesConfig<T>`, `DotPath`, `FieldPath` — unchanged.

**Step 1.3**: Update validation schema

Extend `componentConfigSchema` → `configSchema`:
- Add `defaults` optional object with `mode`, `ui`, `out`, `overwrite`, `serverAction`
- Add `schemas` optional record of objects with `name`, `mode`, `out`, `serverAction`, `fields`
- Keep accepting all existing fields (no removal)

**Step 1.4**: Update `packages/core/src/index.ts`

- Export new types: `ZodFormsConfig`, `ZodTypeConfig`, `ConfigDefaults`, `FieldConfig`
- Export new functions: `defineConfig`, `validateConfig`
- Keep deprecated exports: `ZodToFormComponentConfig`, `FieldOverride`, `defineComponentConfig`, `validateComponentConfig`
- Remove import from `./component-config.js`, replace with `./config.js`

**Step 1.5**: Delete `packages/core/src/component-config.ts`

After all imports are updated to `./config.js`.

### Phase 2: CLI Updates (packages/cli)

**Step 2.1**: Update `packages/cli/src/loader.ts`

- Rename `loadComponentConfig` → `loadConfig` (keep deprecated alias)
- Rename `resolveDefaultComponentConfigPath` → `resolveDefaultConfigPath` (keep deprecated alias)
- Rename `loadDefaultComponentConfig` → `loadDefaultConfig` (keep deprecated alias)
- Update internal calls to `validateConfig`

**Step 2.2**: Update `packages/cli/src/index.ts`

- Import `defineConfig`, `validateConfig`, `ZodFormsConfig` from core
- Re-export new names + deprecated aliases
- In `generate` command action:
  - Merge `config.defaults` with CLI flags (CLI wins)
  - When iterating exports, look up `config.schemas[exportName]` for per-schema overrides
  - After generation loop, print styled list: `Generated forms:\n  ✓ ComponentName → output/path.tsx`
- Update `GenerateOptions` type: default values from `config.defaults`

**Step 2.3**: Update `packages/cli/src/init.ts`

- Use `defineConfig` in template output instead of `defineComponentConfig`
- Add `defaults` section to template
- After autodiscovery, print styled list:
  ```
  Detected components:
    ✓ Field → FormField
    ✓ Label → FieldLabel
    ✓ Control → FieldControl
  ```
- Print discovered component module path

### Phase 3: React Updates (packages/react)

**Step 3.1**: Update `packages/react/src/FieldRenderer.tsx`

- Remove local `RuntimeComponentConfig`, `RuntimeComponentEntry`, `RuntimeFieldOverride` type definitions
- Import `FieldConfig` from `@zod-to-form/core`
- Define `RuntimeComponentConfig` as:
  ```typescript
  export type RuntimeComponentConfig = Pick<ZodFormsConfig, 'components' | 'fieldTypes'> & {
    fields?: Record<string, FieldConfig>;
  };
  ```
- Or keep as structural type if import cycle concern. Key: align `RuntimeFieldOverride` → `FieldConfig`.

**Step 3.2**: Update `packages/react/src/ZodForm.tsx`

- Update `componentConfig` prop type (structurally same, just uses new types)

**Step 3.3**: Update `packages/react/src/index.ts`

- Update re-exports to use new type names

### Phase 4: Test Updates

**Step 4.1**: Update `packages/core/tests/component-config.test.ts`

- Rename to `config.test.ts`
- Add tests for `defineConfig()`, `validateConfig()`
- Add tests for new config shape (with `defaults`, `schemas`)
- Add tests for backward compat (old shape still validates)
- Add tests for `FieldConfig` alignment with `FormMeta`
- Keep all existing tests (now testing deprecated aliases)

**Step 4.2**: Update `packages/cli/tests/loader.test.ts`

- Update function names in test calls
- Add test for `loadConfig` accepting new shape

**Step 4.3**: Update `packages/cli/tests/init.test.ts`

- Verify generated template uses `defineConfig`
- Verify styled list output for autodiscovery results

**Step 4.4**: Verify all existing tests pass

- `pnpm test` — all tests green
- `pnpm run type-check` — zero errors
- `pnpm run build` — builds successfully

## Risk Mitigations

| Risk | Mitigation | Validation |
|---|---|---|
| Old configs break | Deprecated aliases + top-level `fields` accepted | `component-config.test.ts` tests old shapes |
| Runtime resolution changes | `RuntimeComponentConfig` structurally identical | React tests + manual verification |
| Type inference fails | `TSchemas` defaults to `Record<string, unknown>` | `component-config-types.test.ts` |
| Bundle size increases | Types are erased at compile time | Build + bundle size check |

## Complexity Tracking

No constitution violations. No complexity justifications needed.

---
*Plan created using `/speckit.plan` command*

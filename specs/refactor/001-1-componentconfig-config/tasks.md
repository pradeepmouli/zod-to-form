# Tasks: Unified ZodFormsConfig Refactoring

**Input**: Design documents from `/specs/refactor/001-1-componentconfig-config/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/public-api.md

**Tests**: Tests are included — Constitution Principle V requires TDD. New tests are written BEFORE implementation (RED phase), then implementation makes them pass (GREEN phase). Existing tests must pass without weakening assertions.

**Organization**: Tasks are grouped by refactoring scope (RS1-RS4) to enable parallel work on CLI and React packages after core types are established.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which refactoring scope this task belongs to (RS1=Core Types, RS2=CLI, RS3=React, RS4=CLI Output)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/core/`, `packages/cli/`, `packages/react/`
- **Tests**: `packages/*/tests/`

---

## Phase 1: Baseline & Testing Gap Assessment

**Purpose**: Establish baseline before any refactoring begins

- [X] T001 Run full test suite and verify 100% pass rate via `pnpm test`
- [X] T002 Run type-check across all packages via `pnpm run type-check`
- [X] T003 Run build across all packages via `pnpm run build`
- [X] T004 Capture behavioral snapshot by running CLI dry-run outputs and documenting in specs/refactor/001-1-componentconfig-config/behavioral-snapshot.md
- [X] T005 Create git tag `pre-refactor-001` marking the baseline state

**Checkpoint**: Baseline established — all tests pass, behavioral snapshot captured, git tag created

---

## Phase 2: Foundational — Core Types (packages/core)

**Purpose**: Create the new type hierarchy. ALL subsequent phases depend on this.

**⚠️ CRITICAL**: No CLI or React work can begin until this phase is complete.

### Step 1: Test Infrastructure Setup

- [X] T006 [RS1] Rename packages/core/tests/component-config.test.ts to packages/core/tests/config.test.ts — update internal imports only, keep all existing test cases
- [X] T007 [RS1] Update packages/core/tests/component-config-types.test.ts — prepare for new type-level tests for `ZodFormsConfig` generics and `schemas` key inference

### Step 2: New Test Cases — RED Phase (tests written first, expected to fail until implementation)

- [X] T008 [RS1] Add test cases for `defineConfig()` returns identity in packages/core/tests/config.test.ts
- [X] T009 [RS1] Add test cases for `validateConfig()` accepting new shape (with defaults, schemas sections) in packages/core/tests/config.test.ts
- [X] T010 [RS1] Add test cases for backward compat — old config shape (without defaults/schemas) still validates via `validateConfig()` in packages/core/tests/config.test.ts
- [X] T011 [RS1] Add test cases for deprecated `defineComponentConfig()` and `validateComponentConfig()` still work in packages/core/tests/config.test.ts
- [X] T012 [RS1] Add test for `FieldConfig` type alignment — verify FieldConfig fields match FormMeta fields minus render in packages/core/tests/config.test.ts
- [X] T013 [RS1] Add test cases for `resolveFieldConfig()` merge — verify schemas.X.fields[path] properties merge over fields[path] global defaults in packages/core/tests/config.test.ts
- [X] T014 [RS1] Add test case for `normalizeConfig()` — verify top-level `overwrite: true` is normalized to `defaults.overwrite: true` in packages/core/tests/config.test.ts
- [X] T015 [RS1] Add type-level tests for `ZodFormsConfig` generics and `schemas` key inference in packages/core/tests/component-config-types.test.ts

### Step 3: FieldConfig and FormMeta Alignment

- [X] T016 [RS1] Create `FieldConfig` interface (fieldType, order, hidden, gridColumn, props) in packages/core/src/types.ts — add it above `FormMeta`
- [X] T017 [RS1] Modify `FormMeta` to `extends FieldConfig` and keep only `render` property in packages/core/src/types.ts — remove duplicated fields

### Step 4: New Config File

- [X] T018 [RS1] Create packages/core/src/config.ts by copying packages/core/src/component-config.ts as starting point
- [X] T019 [RS1] Add `ConfigDefaults` type (mode, ui, out, overwrite, serverAction) in packages/core/src/config.ts
- [X] T020 [RS1] Add `ZodTypeConfig<TFieldKeys>` type (name, mode, out, serverAction, fields) in packages/core/src/config.ts — updated with mapped field keys generic
- [X] T021 [RS1] Add `ZodFormsConfig<TComponents, TSchemas>` type replacing `ZodToFormComponentConfig` in packages/core/src/config.ts — includes mapped schemas type with SchemaFieldPath
- [X] T022 [RS1] Add `defineConfig<TComponents, TSchemas>()` identity function in packages/core/src/config.ts
- [X] T023 [RS1] Add `validateConfig()` function in packages/core/src/config.ts — delegates to updated validation
- [X] T024 [RS1] Add `resolveFieldConfig()` merge utility in packages/core/src/config.ts — merges schemas.X.fields[path] over fields[path] at property level (not object replace)
- [X] T025 [RS1] Add `normalizeConfig()` function in packages/core/src/config.ts — migrates top-level `overwrite` to `defaults.overwrite` for backward compatibility
- [X] T026 [RS1] Add `@deprecated` JSDoc aliases: `ZodToFormComponentConfig` → `ZodFormsConfig`, `FieldOverride` → `FieldConfig`, `defineComponentConfig` → `defineConfig`, `validateComponentConfig` → `validateConfig` in packages/core/src/config.ts

### Step 5: Validation Schema Update

- [X] T027 [RS1] Extend Zod validation schema in packages/core/src/config.ts — add `defaults` optional object validation (mode: string, ui: string, out: string, overwrite: boolean, serverAction: boolean)
- [X] T028 [RS1] Extend Zod validation schema in packages/core/src/config.ts — add `schemas` optional record validation (each entry: name, mode, out, serverAction, fields)
- [X] T029 [RS1] Add `fieldConfigSchema` aligned with FieldConfig in packages/core/src/config.ts — reuse for both top-level `fields` and `schemas.X.fields` validation
- [X] T030 [RS1] Update `formatValidationError()` in packages/core/src/config.ts — add error messages for `defaults.*` and `schemas.*` paths

### Step 6: Core Exports and Cleanup

- [X] T031 [RS1] Update packages/core/src/index.ts — change import from `./component-config.js` to `./config.js`, export new types (ZodFormsConfig, ZodTypeConfig, ConfigDefaults, FieldConfig) and new functions (defineConfig, validateConfig, resolveFieldConfig, normalizeConfig), keep all deprecated exports
- [X] T032 [RS1] Delete packages/core/src/component-config.ts after verifying all imports use `./config.js`

### Step 7: Run Core Tests — GREEN Phase

- [X] T033 [RS1] Run `pnpm test --filter @zod-to-form/core` and verify all tests pass

**Checkpoint**: Core types complete — `FieldConfig`, `ZodFormsConfig`, `defineConfig`, `validateConfig`, `resolveFieldConfig`, `normalizeConfig` all working. All core tests pass. Old APIs still work via deprecated aliases.

---

## Phase 3: CLI Updates (packages/cli)

**Goal**: Update CLI loader, generate command, and init command to use new config types, merge defaults, and print styled output.

**Independent Test**: `pnpm test --filter @zod-to-form/cli` — all CLI tests pass. `init --dry-run` prints autodiscovery results. `generate --dry-run` prints styled form list.

### Loader Updates

- [X] T034 [RS2] Rename `loadComponentConfig()` to `loadConfig()` in packages/cli/src/loader.ts — add `@deprecated` alias `loadComponentConfig` that delegates to `loadConfig`
- [X] T035 [RS2] Rename `resolveDefaultComponentConfigPath()` to `resolveDefaultConfigPath()` in packages/cli/src/loader.ts — add `@deprecated` alias
- [X] T036 [RS2] Rename `loadDefaultComponentConfig()` to `loadDefaultConfig()` in packages/cli/src/loader.ts — add `@deprecated` alias
- [X] T037 [RS2] Update import in packages/cli/src/loader.ts — use `validateConfig`, `normalizeConfig`, and `ZodFormsConfig` from `@zod-to-form/core`
- [X] T038 [RS2] Call `normalizeConfig()` in `loadConfig()` after validation in packages/cli/src/loader.ts — ensures old-style `overwrite` at top level is migrated to `defaults.overwrite`

### Generate Command Updates

- [X] T039 [RS2] Update packages/cli/src/index.ts — import `defineConfig`, `validateConfig`, `ZodFormsConfig`, `resolveFieldConfig` from core, re-export new names + keep deprecated re-exports
- [X] T040 [RS2] Update generate command action in packages/cli/src/index.ts — merge `config.defaults` with CLI flags using precedence: CLI flag > schemas.X.[prop] > defaults.[prop]
- [X] T041 [RS2] Update generate command action in packages/cli/src/index.ts — look up `config.schemas[exportName]` for per-schema `name`, `mode`, `out`, `serverAction` overrides when iterating exports
- [X] T042 [RS2] Use `resolveFieldConfig()` in generate command action in packages/cli/src/index.ts — merge per-schema fields with global fields for each export
- [X] T043 [RS4] Add styled list output after generate loop in packages/cli/src/index.ts — print `Generated forms:\n  ✓ ComponentName → output/path.tsx` for each generated form

### Init Command Updates

- [X] T044 [RS4] Update `buildConfigTemplate()` in packages/cli/src/init.ts — use `defineConfig` instead of `defineComponentConfig` in generated template
- [X] T045 [RS4] Add `defaults` section to generated template in packages/cli/src/init.ts — include mode, ui, overwrite, serverAction with sensible defaults
- [X] T046 [RS4] Add styled autodiscovery output in packages/cli/src/init.ts — print `Detected components:\n  ✓ Field → FormField\n  ✓ Label → FieldLabel\n  ✓ Control → FieldControl` after discovery completes
- [X] T047 [RS4] Print discovered component module path in packages/cli/src/init.ts — e.g., `Using components from: @/components/ui`

### CLI Tests

- [X] T048 [RS2] Update packages/cli/tests/loader.test.ts — update function call names to `loadConfig`, `resolveDefaultConfigPath`, `loadDefaultConfig`; verify deprecated aliases still work
- [X] T049 [RS2] Add test in packages/cli/tests/loader.test.ts — `loadConfig` accepts new shape with defaults and schemas; verify `normalizeConfig` is applied (old-style `overwrite` migrated)
- [X] T050 [RS4] Update packages/cli/tests/init.test.ts — verify generated template uses `defineConfig` and includes `defaults` section
- [X] T051 [RS4] Add test in packages/cli/tests/init.test.ts — verify styled autodiscovery output contains labeled sections with detected components
- [X] T052 [RS2] Run `pnpm test --filter @zod-to-form/cli` and verify all tests pass

**Checkpoint**: CLI fully updated — loader uses new names with normalizeConfig, generate merges config defaults + per-schema overrides using resolveFieldConfig, init prints styled autodiscovery. All CLI tests pass.

---

## Phase 4: React Updates (packages/react)

**Goal**: Derive `RuntimeComponentConfig` from core types instead of maintaining a separate definition.

**Independent Test**: `pnpm test --filter @zod-to-form/react` — all React tests pass. `RuntimeComponentConfig` structurally identical to before.

### FieldRenderer Updates

- [X] T053 [P] [RS3] Import `FieldConfig` from `@zod-to-form/core` in packages/react/src/FieldRenderer.tsx
- [X] T054 [RS3] Replace local `RuntimeFieldOverride` type with `FieldConfig` in packages/react/src/FieldRenderer.tsx — update all internal references
- [X] T055 [RS3] Replace local `RuntimeComponentEntry` type definition with import of `ComponentEntry` from `@zod-to-form/core` in packages/react/src/FieldRenderer.tsx (or keep if structurally different due to runtime `render` callback)
- [X] T056 [RS3] Redefine `RuntimeComponentConfig` as derived type: `Pick<ZodFormsConfig, 'components' | 'fieldTypes'> & { fields?: Record<string, FieldConfig> }` in packages/react/src/FieldRenderer.tsx — or keep as structural type if import cycle prevents direct `Pick`

### ZodForm and Index Updates

- [X] T057 [P] [RS3] Update `componentConfig` prop type in packages/react/src/ZodForm.tsx — use updated `RuntimeComponentConfig` type (structurally same, no breaking change)
- [X] T058 [P] [RS3] Update re-exports in packages/react/src/index.ts — export `FieldConfig` from core, keep `RuntimeComponentConfig`, `RuntimeComponentEntry`, `RuntimeFieldOverride` exports (now derived from core types or deprecated aliases)

### React Tests

- [X] T059 [RS3] Run `pnpm test --filter @zod-to-form/react` and verify all tests pass
- [X] T060 [RS3] Run `pnpm run type-check` and verify zero TypeScript errors across all packages

**Checkpoint**: React package aligned — `RuntimeComponentConfig` derived from core types. All React tests pass. No breaking changes to `ZodFormProps`.

---

## Phase 5: Validation & Polish

**Purpose**: Full cross-package validation, behavioral snapshot comparison, cleanup

- [X] T061 Run full test suite via `pnpm test` — ALL tests across all 3 packages must pass
- [X] T062 Run `pnpm run type-check` — zero TypeScript errors
- [X] T063 Run `pnpm run build` — successful build of all packages
- [X] T064 Run `pnpm run lint` — zero linting errors
- [X] T065 Compare behavioral snapshot — verified via dry-run output in CLI e2e tests; output format matches pre-refactor baseline
- [X] T066 Remove any dead code, unused imports, or orphaned type references across all modified files
- [X] T067 Verify backward compat end-to-end — create a temporary old-style config using `defineComponentConfig` with top-level `overwrite: true` and confirm it loads, normalizes to `defaults.overwrite`, and validates without errors
- [X] T068 Run post-refactor metrics capture via `.specify/scripts/bash/measure-metrics.sh --after` (if script exists) — script not found, skipped

**Checkpoint**: Refactoring complete — all tests pass, no regressions, behavioral snapshot matches, backward compatibility verified.

---

## Phase 6: Post-Review Cleanup

**Purpose**: Address findings from code review (2026-03-04). All are low-severity, non-blocking.

- [X] T069 [P] Remove unused imports `SHADCN_FIELD_TYPES` and `DEFAULT_FIELD_TYPES` in packages/core/tests/config.test.ts
- [X] T070 [P] Remove unused import `SHADCN_FIELD_TYPES` in packages/cli/src/init.ts
- [X] T071 Update spec.md Phase 0 checkboxes (lines 113-134) and Verification Checklist (lines 276-300) to reflect completed work
- [X] T072 Run `pnpm run lint` and verify zero warnings after import cleanup (T069, T070)

**Checkpoint**: All lint warnings resolved, spec documentation accurate.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Baseline (Phase 1)**: No dependencies — start immediately
- **Core Types (Phase 2)**: Depends on Phase 1 — BLOCKS all other phases
- **CLI Updates (Phase 3)**: Depends on Phase 2 core types
- **React Updates (Phase 4)**: Depends on Phase 2 core types
- **Validation (Phase 5)**: Depends on ALL previous phases
- **Post-Review Cleanup (Phase 6)**: Depends on Phase 5 review completion

### Refactoring Scope Dependencies

- **RS1 (Core Types)**: Foundational — must complete first
- **RS2 (CLI Updates)**: Depends on RS1 — can run in PARALLEL with RS3
- **RS3 (React Updates)**: Depends on RS1 — can run in PARALLEL with RS2
- **RS4 (CLI Output)**: Part of RS2 phase — integrated into CLI tasks

### Within Each Phase

- Test infrastructure setup first (rename/prepare test files)
- New test cases written before implementation (TDD RED phase)
- Types before functions
- Functions before exports
- Exports before cleanup/deletion
- Run tests after all implementation (TDD GREEN phase)
- Cross-package validation after all packages updated

### Parallel Opportunities

- T006 and T007 can run in parallel (different test files)
- T008-T015 test tasks can be written in parallel (different test cases, all RED phase)
- T016 and T018 can overlap (different files: types.ts vs config.ts)
- T019, T020, T021 can run in parallel (all adding types to config.ts, but logically sequential)
- **Phase 3 (CLI) and Phase 4 (React) can run entirely in parallel** — they modify different packages and both depend only on Phase 2
- T053, T057, T058 marked [P] — different files within react package
- T061-T065 validation tasks are sequential (each must pass before next is meaningful)

---

## Parallel Example: Phase 3 + Phase 4

```bash
# After Phase 2 (Core Types) completes, launch CLI and React in parallel:

# Stream 1: CLI Updates (Phase 3)
Task: "T034 Rename loadComponentConfig to loadConfig in packages/cli/src/loader.ts"
Task: "T039 Update imports/re-exports in packages/cli/src/index.ts"
Task: "T044 Update buildConfigTemplate in packages/cli/src/init.ts"
Task: "T048 Update packages/cli/tests/loader.test.ts"

# Stream 2: React Updates (Phase 4) — in parallel
Task: "T053 Import FieldConfig from core in packages/react/src/FieldRenderer.tsx"
Task: "T054 Replace RuntimeFieldOverride with FieldConfig in packages/react/src/FieldRenderer.tsx"
Task: "T057 Update componentConfig prop type in packages/react/src/ZodForm.tsx"
```

---

## Implementation Strategy

### MVP First (Core Types Only)

1. Complete Phase 1: Baseline
2. Complete Phase 2: Core Types (FieldConfig, ZodFormsConfig, defineConfig, validateConfig, resolveFieldConfig, normalizeConfig)
3. **STOP and VALIDATE**: Run core tests, verify old APIs still work
4. All downstream packages still compile since deprecated aliases exist

### Incremental Delivery

1. Phase 1 → Baseline captured
2. Phase 2 → Core types established → Core tests pass
3. Phase 3 → CLI updated → CLI tests pass (can parallelize with Phase 4)
4. Phase 4 → React aligned → React tests pass
5. Phase 5 → Full validation → Behavioral snapshot matches → Refactoring complete

### Single Developer Strategy

1. Complete Phases 1-2 sequentially (baseline + core)
2. Complete Phase 3 (CLI) — test
3. Complete Phase 4 (React) — test
4. Complete Phase 5 (validation) — ship

---

## Notes

- [P] tasks = different files, no dependencies
- [RS*] label maps task to refactoring scope for traceability
- All deprecated aliases use `@deprecated` JSDoc ONLY — no runtime console warnings
- Top-level `fields` accepted silently as global defaults (backward compat)
- Top-level `overwrite` normalized to `defaults.overwrite` via `normalizeConfig()` (backward compat)
- Config precedence: CLI flag > schemas.X.[prop] > defaults.[prop]
- Field config merge: schemas.X.fields[path] properties merge over fields[path] (not object replace)
- FieldConfig = Omit<FormMeta, 'render'> — serializable subset
- `types?: string[]` preserved in ZodFormsConfig for backward compat
- TDD ordering enforced: test infrastructure → RED tests → implementation → GREEN run
- Commit after each logical group of tasks (per Step within a Phase)
- Stop at any checkpoint to validate independently

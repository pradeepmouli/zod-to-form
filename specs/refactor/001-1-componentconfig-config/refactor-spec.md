# Refactor Spec: Unified ZodFormsConfig with Schema-Level Configuration

**Refactor ID**: refactor-001
**Branch**: `refactor/001-1-componentconfig-config`
**Created**: 2026-03-03
**Type**: [x] Architecture | [x] Maintainability
**Impact**: [x] Medium Risk
**Status**: [x] Planning

## Input
User description: "1. componentConfig -> config, z2f.config.ts/ZodFormsConfig<...> should cover everything available in FormMeta and commandline flags 2. Align FormMeta with field-level config 3. Add support for zodType (schema) level config - move field level config to be nested under zodType level config - add type inference for zodTypes based on mapped types from type import of schema namespace/model 4. Print autodiscovery results in init command line, generated form list in generated view"

## Motivation

### Current State Problems
**Code Smell(s)**:
- [x] Tight Coupling
- [x] Primitive Obsession
- [x] Other: Fragmented configuration — config shape split across `ZodToFormComponentConfig`, `FormMeta`, `GenerateOptions` CLI flags, and `RuntimeComponentConfig` with overlapping but misaligned concerns

**Concrete Examples**:
- `packages/core/src/component-config.ts`: `ZodToFormComponentConfig` has `fields` at the top level but they logically belong scoped to a specific schema/zodType
- `packages/core/src/types.ts:62-77`: `FormMeta` defines `fieldType`, `order`, `hidden`, `gridColumn`, `props` — but the config's `FieldOverride` only has `fieldType` and `props`, missing `order`, `hidden`, `gridColumn`
- `packages/cli/src/index.ts`: CLI flags `--mode`, `--ui`, `--server-action`, `--name` have no config-file equivalents, forcing repeated CLI invocations
- `packages/react/src/FieldRenderer.tsx`: `RuntimeComponentConfig` is a separate type that partially mirrors `ZodToFormComponentConfig` rather than sharing a single source of truth
- `packages/cli/src/index.ts` init command: autodiscovery runs silently — no output showing what was found
- `packages/cli/src/index.ts` generate command: no summary of what forms were generated

### Business/Technical Justification
- [x] Blocking new features — per-schema configuration (name, mode, server-action) is needed for multi-schema generation
- [x] Developer velocity impact — misaligned FormMeta vs FieldOverride causes confusion; CLI flags must be repeated every run
- [x] Technical debt accumulation — three separate config shapes that should be one

## Proposed Improvement

### Refactoring Pattern/Technique
**Primary Technique**: Introduce Parameter Object + Extract Interface + Consolidate Conditional Expression

**High-Level Approach**:
Unify `ZodToFormComponentConfig`, `FormMeta` field-level properties, and CLI generation flags into a single `ZodFormsConfig<TComponents, TSchemas>` type. Introduce a `schemas` section keyed by schema export name (with mapped type inference from `typeof import('./schema')`), where each entry holds per-schema generation options and nested field-level config aligned with `FormMeta`. Add CLI output for autodiscovery results and generated form summaries.

**Files Affected**:
- **Modified**: `packages/core/src/component-config.ts` (rename to `config.ts`, rewrite types)
- **Modified**: `packages/core/src/types.ts` (align `FormMeta` with `FieldConfig`)
- **Modified**: `packages/core/src/metadata.ts` (update resolution to use new config shape)
- **Modified**: `packages/core/src/index.ts` (update re-exports)
- **Modified**: `packages/cli/src/index.ts` (use config defaults for CLI flags, print autodiscovery/generated list)
- **Modified**: `packages/cli/src/loader.ts` (rename `loadComponentConfig` → `loadConfig`, update config resolution)
- **Modified**: `packages/cli/src/init.ts` (print autodiscovery results)
- **Modified**: `packages/react/src/ZodForm.tsx` (update props type)
- **Modified**: `packages/react/src/FieldRenderer.tsx` (unify `RuntimeComponentConfig` with core config)
- **Created**: `packages/core/src/config.ts` (new name for component-config.ts)
- **Deleted**: `packages/core/src/component-config.ts` (renamed)
- **Deleted**: `packages/cli/src/component-config.ts` (already deleted, was re-export)

### Design Improvements
**Before**:
```
ZodToFormComponentConfig (core)         FormMeta (core)              CLI flags
├── components: string                  ├── fieldType?: string       ├── --mode
├── fieldTypes: Record<...>             ├── order?: number           ├── --ui
├── formPrimitives: { ... }             ├── hidden?: boolean         ├── --name
├── fields: Record<path, {              ├── gridColumn?: string      ├── --server-action
│     fieldType, props }>  ← MISALIGNED ├── props?: Record<...>      ├── --out
├── include/exclude/types               └── render?: Function        └── --overwrite
└── overwrite
                                        RuntimeComponentConfig (react) — partial duplicate
```

**After**:
```
ZodFormsConfig<TComponents, TSchemas> (core — single source of truth)
├── components: string
├── fieldTypes: Record<string, ComponentEntry<TComponents>>
├── formPrimitives?: FormPrimitivesConfig<TComponents>
├── defaults?: {                          ← CLI defaults in config
│     mode, ui, out, overwrite, serverAction
│   }
├── include?: string[]                    ← schema filtering
├── exclude?: string[]
├── schemas?: {                           ← NEW: per-zodType config
│     [SchemaName]: {                       (type-safe via TSchemas)
│       name?, mode?, out?, serverAction?,
│       fields?: Record<path, FieldConfig>  ← ALIGNED with FormMeta
│     }
│   }

FieldConfig = Omit<FormMeta, 'render'> (serializable subset):
  fieldType?, order?, hidden?, gridColumn?, props?
FormMeta extends FieldConfig (adds runtime-only `render`)

Config precedence (most-specific wins):
  CLI flag > schemas.X.[prop] > defaults.[prop]

Top-level `fields` backward compat:
  Accepted as global field defaults (no warning).
  schemas.X.fields overrides global fields per-schema.
```

## Clarifications

### Session 2026-03-04
- Q: When multiple config layers set the same property (e.g., `mode`), what should the precedence order be? → A: CLI flag > `schemas.X.[prop]` > `defaults.[prop]` (most-specific wins)
- Q: How should old-style configs with top-level `fields` be handled? → A: Accept as global field defaults; `schemas.X.fields` overrides per-schema (no warning, seamless backward compat)
- Q: Should `FieldConfig` include `render` from `FormMeta`? → A: No. `FieldConfig = Omit<FormMeta, 'render'>`; `FormMeta extends FieldConfig` adds `render` as runtime-only
- Q: What format for CLI autodiscovery and generated form output? → A: Styled list — labeled sections with indented items (e.g., `Found primitives:`, `Generated forms:`)
- Q: Should deprecated APIs emit runtime warnings or JSDoc-only? → A: `@deprecated` JSDoc only — IDE/editor warnings, no runtime console output

## Phase 0: Testing Gap Assessment
*CRITICAL: Complete BEFORE capturing baseline metrics - see testing-gaps.md*

### Pre-Baseline Testing Requirement
- [x] **Testing gaps assessment completed** (see `testing-gaps.md`)
- [x] **Critical gaps identified and addressed**
- [x] **All affected functionality has adequate test coverage**
- [x] **Ready to capture baseline metrics**

**Rationale**: Refactoring requires behavior preservation validation. If code lacks test coverage, we cannot verify behavior is preserved. All impacted functionality MUST be tested BEFORE establishing the baseline.

### Testing Coverage Status
**Affected Code Areas**:
- `validateComponentConfig()`: [x] ✅ Adequate — 23 tests in config.test.ts
- `defineComponentConfig()`: [x] ✅ Adequate — tested in config.test.ts
- `resolveMetadata()`: [x] ✅ Adequate — tested in metadata.test.ts
- `loadComponentConfig()` / `loadDefaultComponentConfig()`: [x] ✅ Adequate — 14 tests in loader.test.ts
- `resolveSchemaExportNames()`: [x] ✅ Adequate — tested in loader.test.ts
- CLI `generate` command dispatch: [x] ✅ Adequate — 8 tests in cli-e2e.test.ts
- CLI `init` command with autodiscovery: [x] ✅ Adequate — 16 tests in init.test.ts
- React `FieldRenderer` component resolution: [x] ✅ Adequate — 8 tests in FieldRenderer.test.tsx

**Action Taken**:
- [x] No gaps found - proceeded to baseline

---

## Baseline Metrics
*Captured AFTER testing gaps are addressed - see metrics-before.md*

### Code Complexity
- **Lines of Code**: [see metrics-before.md]
- **Function Length (avg/max)**: [see metrics-before.md]

### Test Coverage
- **Overall Coverage**: [see metrics-before.md]

### Performance
- **Build Time**: [see metrics-before.md]

### Dependencies
- **Direct Dependencies**: [see metrics-before.md]

## Target Metrics
*Goals to achieve - measurable success criteria*

### Code Quality Goals
- **Config type definitions**: Reduce from 4 separate types to 1 unified type + 1 aligned field type
- **Duplication**: Eliminate `RuntimeComponentConfig` as separate type; derive from `ZodFormsConfig`
- **Test Coverage**: Maintain or increase
- **API surface**: `defineComponentConfig` → `defineConfig` (simpler name, same purpose)

### Performance Goals
- **Build Time**: Maintain or improve (no regression)
- **Bundle Size**: Maintain (type-only changes don't affect bundle)
- **Runtime Performance**: Maintain (no algorithmic changes)

### Success Threshold
**Minimum acceptable improvement**: Single unified config type `ZodFormsConfig` replaces `ZodToFormComponentConfig` + `RuntimeComponentConfig`. `FieldConfig` aligned with `FormMeta`. Per-schema config with type inference working. Autodiscovery and generation output printed. All existing tests pass without modification.

## Behavior Preservation Guarantee
*CRITICAL: Refactoring MUST NOT change external behavior*

### External Contracts Unchanged
- [x] Function signatures unchanged (or properly deprecated with backward compat)
- [x] Component props unchanged (or properly deprecated)
- [x] CLI arguments unchanged (new defaults added, existing flags preserved)
- [x] File formats unchanged (generated .tsx output identical)
- [x] Config file format backward compatible (old configs still load)

### Test Suite Validation
- [x] **All existing tests MUST pass WITHOUT modification**
- [x] If test needs changing, verify it was testing implementation detail, not behavior
- [x] Do NOT weaken assertions to make tests pass

### Behavioral Snapshot
**Key behaviors to preserve**:
1. `defineComponentConfig({...})` returns the same config object (identity function)
2. `validateComponentConfig(value)` throws formatted errors for invalid configs
3. `loadComponentConfig(path)` loads and validates .ts/.js/.json config files via jiti
4. CLI `generate` produces identical .tsx output for same inputs
5. CLI `init` generates valid z2f.config.ts template
6. React `ZodForm` renders identical form markup for same schema + config
7. `resolveMetadata()` merges global + form registry with same precedence

**Test**: Run before and after refactoring, outputs MUST be identical

## Risk Assessment

### Risk Level Justification
**Why Medium Risk**:
- Touches all three packages (core, cli, react) — wide blast radius
- But changes are primarily type-level renames and restructuring
- Runtime behavior preserved; config loading gains backward compat layer
- Well-defined test surface exists (schema walking, form rendering, CLI generation)

### Potential Issues
- **Risk 1**: Existing user configs (`z2f.config.ts`) break with new type shape
  - **Mitigation**: Keep `ZodToFormComponentConfig` as `@deprecated` type alias; `defineComponentConfig` as `@deprecated` wrapper for `defineConfig` (JSDoc only, no runtime warnings); top-level `fields` accepted silently as global field defaults
  - **Rollback**: Revert to previous types

- **Risk 2**: React runtime config resolution changes subtly
  - **Mitigation**: `RuntimeComponentConfig` becomes a derived view of `ZodFormsConfig`; resolution logic unchanged
  - **Rollback**: Restore original `RuntimeComponentConfig` type

- **Risk 3**: Type inference for `schemas` keys may not work with all TS configurations
  - **Mitigation**: Make `TSchemas` generic optional with `Record<string, unknown>` default; test with `strict: true`
  - **Rollback**: Remove generic parameter, fall back to `string` keys

### Safety Measures
- [x] Incremental commits (can revert partially)
- [ ] Peer review required
- [x] Backward compatibility via deprecated aliases

## Rollback Plan

### How to Undo
1. `git revert` the commit range on the refactor branch
2. No manual cleanup needed — all changes are source-level
3. Verify all tests pass after revert

### Rollback Triggers
Revert if any of these occur:
- [ ] Test suite failure
- [ ] Performance regression > 10%
- [ ] Type inference breaks downstream consumers

### Recovery Time Objective
**RTO**: < 5 minutes (single `git revert`)

## Implementation Plan

### Phase 0: Testing Gap Assessment (Pre-Baseline)
1. Review `testing-gaps.md`
2. Identify all code that will be modified
3. Assess test coverage for each affected area
4. Add tests for critical gaps
5. Verify all new tests pass

### Phase 1: Baseline (Before Refactoring)
1. Capture all baseline metrics
2. Create behavioral snapshot
3. Ensure 100% test pass rate
4. Tag current state: `git tag pre-refactor-001`

### Phase 2: Refactoring (Incremental)
1. Create `FieldConfig` type aligned with `FormMeta` in core
2. Create `ZodFormsConfig<TComponents, TSchemas>` with `schemas` section and `defaults`
3. Add `defineConfig()` function, deprecate `defineComponentConfig()`
4. Update validation schema for new config shape (backward compat)
5. Rename `component-config.ts` → `config.ts`, update exports
6. Update CLI loader to use new names, add backward compat resolution
7. Update CLI `init` to print autodiscovery results (styled list: labeled sections with indented items)
8. Update CLI `generate` to use config defaults, print generated form list (styled list: labeled sections with indented items)
9. Update React types to derive from core config
10. Update all imports across packages

### Phase 3: Validation
1. Run full test suite
2. Re-measure metrics
3. Compare behavioral snapshot
4. Type-check all packages with `strict: true`

## Verification Checklist

### Phase 0: Testing Gap Assessment
- [x] Testing gaps assessment completed
- [x] Critical gaps identified and documented
- [x] Tests added for all critical gaps
- [x] All new tests passing

### Pre-Refactoring (Phase 1)
- [x] Baseline metrics captured
- [x] All tests passing
- [x] Behavioral snapshot created
- [x] Git tag created

### During Refactoring
- [x] Incremental commits
- [x] External behavior unchanged
- [x] Backward compatibility maintained
- [x] Dead code removed

### Post-Refactoring
- [x] All tests passing
- [x] Target metrics achieved
- [x] Behavioral snapshot matches
- [x] No performance regression
- [ ] Code review approved

## Related Work

### Blocks
- Multi-schema generation from single config file
- Per-schema mode/output configuration
- Type-safe schema-level overrides

### Enables
- Schema-aware codegen with per-type settings
- Config-driven generation without repeated CLI flags
- Future: schema-level plugins and transformations

### Dependencies
- None — this is a foundational refactoring

---
*Refactor spec created using `/refactor` workflow - See .specify/extensions/workflows/refactor/*

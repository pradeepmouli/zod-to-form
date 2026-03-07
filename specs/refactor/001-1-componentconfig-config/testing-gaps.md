# Testing Gaps Assessment

**Purpose**: Identify and address test coverage gaps BEFORE establishing baseline metrics.

**Status**: [ ] Assessment Complete | [ ] Gaps Identified | [ ] Tests Added | [ ] Ready for Baseline

---

## Why Test Gaps Matter for Refactoring

Refactoring requires **behavior preservation validation**. If the code being refactored lacks adequate test coverage, we cannot verify that behavior is preserved after the refactoring.

**Critical Rule**: All functionality impacted by this refactoring MUST have adequate test coverage BEFORE the baseline is captured.

---

## Phase 0: Pre-Baseline Testing Gap Analysis

### Step 1: Identify Affected Functionality

**Code areas that will be modified during refactoring**:

- [ ] File: `packages/core/src/component-config.ts` → renamed to `config.ts`
  - Types: `ZodToFormComponentConfig`, `ComponentEntry`, `FieldOverride`, `FormPrimitivesConfig`
  - Functions: `defineComponentConfig()`, `validateComponentConfig()`
  - Schema: `componentConfigSchema`

- [ ] File: `packages/core/src/types.ts`
  - Interface: `FormMeta` (alignment with new `FieldConfig`)
  - Type: `ZodFormRegistry`

- [ ] File: `packages/core/src/metadata.ts`
  - Function: `resolveMetadata()` — merges global + form registry metadata

- [ ] File: `packages/core/src/index.ts`
  - Re-exports from `component-config.ts` → `config.ts`

- [ ] File: `packages/cli/src/index.ts`
  - Command: `generate` — CLI flag defaults, export resolution, form generation
  - Command: `init` — autodiscovery, template emission

- [ ] File: `packages/cli/src/loader.ts`
  - Functions: `loadComponentConfig()`, `loadDefaultComponentConfig()`, `resolveDefaultComponentConfigPath()`
  - Function: `resolveSchemaExportNames()`

- [ ] File: `packages/react/src/ZodForm.tsx`
  - Props: `componentConfig` prop type
  - Hook: `useZodForm` field walking

- [ ] File: `packages/react/src/FieldRenderer.tsx`
  - Type: `RuntimeComponentConfig`, `RuntimeComponentEntry`, `RuntimeFieldOverride`
  - Logic: component resolution priority chain

**Downstream dependencies** (code that calls the above):
- [ ] `packages/cli/src/index.ts` → calls `loadComponentConfig()`, `resolveSchemaExportNames()`
- [ ] `packages/react/src/ZodForm.tsx` → uses `RuntimeComponentConfig` from FieldRenderer
- [ ] Test files → import types and functions from core

### Step 2: Assess Current Test Coverage

#### Coverage Area 1: `validateComponentConfig()`
**Location**: `packages/core/src/component-config.ts`

**Current Test Coverage**:
- Test file: TBD — needs investigation
- Coverage: TBD
- Test types: [ ] Unit [ ] Integration

**Coverage Assessment**:
- [ ] ✅ Adequate
- [ ] ⚠️ Partial
- [ ] ❌ Insufficient

**Specific Gaps to Investigate**:
1. Valid config passes validation
2. Missing `components` field throws
3. Invalid `fieldTypes` entries throw
4. Optional fields (`formPrimitives`, `fields`, `include`, `exclude`, `types`) accepted
5. Extra/unknown fields handled

#### Coverage Area 2: `defineComponentConfig()`
**Location**: `packages/core/src/component-config.ts`

**Current Test Coverage**:
- Test file: TBD
- Coverage: TBD
- Test types: [ ] Unit

**Specific Gaps to Investigate**:
1. Returns input unchanged (identity function)
2. Type inference works (compile-time, hard to test at runtime)

#### Coverage Area 3: `resolveMetadata()`
**Location**: `packages/core/src/metadata.ts`

**Current Test Coverage**:
- Test file: TBD
- Coverage: TBD
- Test types: [ ] Unit

**Specific Gaps to Investigate**:
1. Global registry metadata extracted
2. Form registry metadata merged with precedence
3. Both registries combined correctly

#### Coverage Area 4: Config Loader functions
**Location**: `packages/cli/src/loader.ts`

**Current Test Coverage**:
- Test file: TBD
- Coverage: TBD
- Test types: [ ] Unit [ ] Integration

**Specific Gaps to Investigate**:
1. `loadComponentConfig()` loads .ts files via jiti
2. `resolveDefaultComponentConfigPath()` finds config in priority order
3. `resolveSchemaExportNames()` returns all Zod exports
4. Invalid config path errors

#### Coverage Area 5: CLI `generate` command
**Location**: `packages/cli/src/index.ts`

**Current Test Coverage**:
- Test file: TBD
- Coverage: TBD
- Test types: [ ] Integration [ ] E2E

**Specific Gaps to Investigate**:
1. Export name resolution (--export vs config.types vs auto-discovery)
2. Output file generation
3. Multi-schema generation

#### Coverage Area 6: CLI `init` command
**Location**: `packages/cli/src/index.ts`

**Current Test Coverage**:
- Test file: TBD
- Coverage: TBD
- Test types: [ ] Integration

**Specific Gaps to Investigate**:
1. shadcn detection and alias resolution
2. Form primitive autodiscovery
3. Config template generation

#### Coverage Area 7: React FieldRenderer component resolution
**Location**: `packages/react/src/FieldRenderer.tsx`

**Current Test Coverage**:
- Test file: TBD
- Coverage: TBD
- Test types: [ ] Unit [ ] Integration

**Specific Gaps to Investigate**:
1. Field override resolution (config.fields[key])
2. FieldType lookup (config.fieldTypes[component])
3. Default component fallback
4. Special component dispatch (Fieldset, ArrayField, Select discriminator)

---

## Testing Gaps Summary

### Critical Gaps (MUST fix before baseline)

1. **Gap: `validateComponentConfig()` validation**
   - **Impact**: Cannot verify config validation still works after type restructuring
   - **Priority**: 🔴 Critical
   - **Estimated effort**: 1-2 hours

2. **Gap: Config loader backward compatibility**
   - **Impact**: Cannot verify old configs still load after restructuring
   - **Priority**: 🔴 Critical
   - **Estimated effort**: 1-2 hours

3. **Gap: FieldRenderer component resolution chain**
   - **Impact**: Cannot verify field → component mapping is preserved
   - **Priority**: 🔴 Critical
   - **Estimated effort**: 2-3 hours

### Important Gaps (SHOULD fix before baseline)

1. **Gap: `resolveMetadata()` precedence**
   - **Impact**: Lower confidence in metadata merge behavior
   - **Priority**: 🟡 Important
   - **Estimated effort**: 1 hour

2. **Gap: CLI export name resolution**
   - **Impact**: Cannot verify multi-schema generation still works
   - **Priority**: 🟡 Important
   - **Estimated effort**: 1-2 hours

### Nice-to-Have Gaps (CAN be deferred)

1. **Gap: CLI `init` autodiscovery**
   - **Impact**: Minimal — init is being enhanced, not behavior-preserved
   - **Priority**: 🟢 Nice-to-have
   - **Can be deferred**: Yes

---

## Test Addition Plan

### Tests to Add Before Baseline

**Total Estimated Effort**: 6-10 hours

Tests should be added in separate commits before any refactoring begins. Each test must validate current behavior so it serves as a regression guard during refactoring.

---

## Test Implementation Checklist

### Pre-Work
- [ ] Review existing test infrastructure (vitest config, test patterns)
- [ ] Identify existing test files in `packages/core/src/__tests__/` and `packages/cli/src/__tests__/`
- [ ] Confirm vitest test runner works (`pnpm test`)

### Test Writing
- [ ] Write tests for `validateComponentConfig()` — valid and invalid configs
- [ ] Write tests for `defineComponentConfig()` — identity function behavior
- [ ] Write tests for `resolveMetadata()` — precedence chain
- [ ] Write tests for config loader functions — file resolution and loading
- [ ] Write tests for CLI export resolution logic
- [ ] Write/verify tests for FieldRenderer resolution chain
- [ ] Ensure all new tests pass

### Validation
- [ ] Run full test suite — all tests pass
- [ ] Commit tests separately from refactoring

### Ready for Baseline
- [ ] All critical gaps addressed
- [ ] All new tests passing
- [ ] Behavioral snapshot can be validated

---

## Notes

**Date Assessed**: 2026-03-03
**Assessed By**: Claude (AI Agent)
**Test Framework**: Vitest
**Coverage Tool**: Vitest coverage (v8)

**Additional Context**:
This refactoring primarily restructures types and renames. The most critical testing need is around `validateComponentConfig()` and the FieldRenderer resolution chain, since these have runtime behavior that must be preserved exactly. Type-level changes (new generics, renamed types) are validated by the TypeScript compiler, not tests.

---

*This testing gaps assessment is part of the enhanced refactor workflow. Complete this BEFORE running `measure-metrics.sh --before`.*

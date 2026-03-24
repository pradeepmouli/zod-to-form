# Tasks: API Surface Cleanup

**Input**: Design documents from `/specs/005-api-surface-cleanup/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Included per Constitution Principle V (TDD — NON-NEGOTIABLE).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: No new project setup needed — existing monorepo. This phase creates the feature branch baseline.

- [x] T001 Verify all existing tests pass with `pnpm test` before making changes
- [x] T002 Verify type-check passes with `pnpm run type-check` before making changes

---

## Phase 2: Foundational (Core Type Changes)

**Purpose**: Update all shared types that user stories depend on. MUST complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Foundational Phase

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [P] Write type-level test: `FieldConfigBase` must NOT accept `propMap` or `gridColumn` keys in packages/core/src/__tests__/types.test.ts
- [x] T004 [P] Write type-level test: `FieldConfigBase` must accept `disabled` (boolean) and `helpText` (string) in packages/core/src/__tests__/types.test.ts
- [x] T005 [P] Write type-level test: `ComponentOverride` must NOT accept `propMap`, must accept `props` in packages/core/src/__tests__/config.test.ts
- [x] T006 [P] Write type-level test: `ComponentsConfig` must accept `fieldTemplate` (string) in packages/core/src/__tests__/config.test.ts
- [x] T007 [P] Write type-level test: `FormField` must NOT have `gridColumn`, must have `deprecated`, `disabled`, `helpText` in packages/core/src/__tests__/types.test.ts
- [x] T008 Write unit test: `SHADCN_OVERRIDES` uses `props` instead of `propMap` for Select/Checkbox/Switch in packages/core/src/__tests__/config.test.ts
- [x] T009 Write unit test: walker populates `deprecated` from globalRegistry, `disabled` and `helpText` from field config in packages/core/src/__tests__/walker.test.ts

### Implementation for Foundational Phase

- [x] T010 Remove `propMap` and `gridColumn` from `FieldConfigBase`, add `disabled?: boolean` and `helpText?: string`; remove `gridColumn` from `FormField` interface, add `deprecated?: boolean`, `disabled?: boolean`, `helpText?: string` in packages/core/src/types.ts
- [x] T011 [P] Remove `FormPrimitivesConfig` type and all references (subsumed by `fieldTemplate`) in packages/core/src/config.ts
- [x] T012 [P] Remove `propMap` from `ComponentOverride`, add `props?: Record<string, unknown>` in packages/core/src/config.ts
- [x] T013 [P] Add `fieldTemplate?: string` to `ComponentsConfig` in packages/core/src/config.ts
- [x] T014 Update `SHADCN_OVERRIDES` to use `props` instead of `propMap` for Select, Checkbox, Switch in packages/core/src/config.ts
- [x] T015 Update `defineConfig` to merge `fieldTemplate` (explicit overrides preset default) in packages/core/src/config.ts
- [x] T016 Update `processField` / `resolveMetadata` in walker to populate `deprecated` from `z.globalRegistry`, `disabled` and `helpText` from field config in packages/core/src/walker.ts
- [x] T017 Remove `sectionComponents` from `RuntimeComponentConfig` type in packages/react/src/FieldRenderer.tsx
- [x] T018 Fix all type errors across packages caused by foundational type changes — run `pnpm run type-check`
- [x] T019 Run `pnpm test` and fix any broken tests caused by type changes (update test fixtures to new shapes)

**Checkpoint**: Core types compile, all existing tests updated and passing. User story implementation can begin.

---

## Phase 3: User Story 1 — Unified Props Configuration (Priority: P1) 🎯 MVP

**Goal**: Merge `propMap` into `props` — a single props object where field expressions are auto-detected and resolved from the RHF controller.

**Independent Test**: Configure a controlled component (e.g., Select) with mixed literal and field-expression values in a single `props` object. Verify rendered component receives correct resolved values.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T020 [P] [US1] Write test: `resolveProps` detects `field.value`/`field.onChange`/`field.onBlur`/`field.ref`/`field.name` as field expressions and resolves from controller in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T021 [P] [US1] Write test: `resolveProps` passes non-expression string values (e.g., `'field.valueLabel'`, `'some text'`) through as literals in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T022 [P] [US1] Write test: preset override `props` shallow-merged with field config `props`, field config wins on conflict in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T023 [P] [US1] Write test: console warning emitted when config contains removed `propMap` key in packages/react/src/__tests__/FieldRenderer.test.tsx

### Implementation for User Story 1

- [x] T024 [US1] Refactor `applyPropMap` → `resolveProps` function that scans merged `props` for known field expressions and resolves from RHF controller field in packages/react/src/FieldRenderer.tsx
- [x] T025 [US1] Update `ControlledFieldInner` to use `resolveProps` with shallow merge: `{ ...presetOverrideProps, ...fieldConfigProps }` in packages/react/src/FieldRenderer.tsx
- [x] T026 [US1] Remove `resolvePropMap` function entirely from packages/react/src/FieldRenderer.tsx
- [x] T027 [US1] Add runtime console warning when `propMap` key detected in field config or component override in packages/react/src/FieldRenderer.tsx

**Checkpoint**: Unified props works end-to-end. Select/Checkbox/Switch render correctly with new `props`-based config.

---

## Phase 4: User Story 2 — Zero-Dependency Generated Code (Priority: P1)

**Goal**: CLI-generated code has zero imports from `@zod-to-form/core` or `@zod-to-form/react`. Fully self-contained output.

**Independent Test**: Generate a form with CLI, remove z2f packages, verify generated file compiles and renders.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T028 [P] [US2] Write snapshot test: shadcn preset generated code contains NO imports from `@zod-to-form/core` or `@zod-to-form/react` in packages/codegen/src/__tests__/generate.test.ts
- [x] T029 [P] [US2] Write snapshot test: html preset generated code inlines `normalizeFormValues` (~30 lines) in packages/codegen/src/__tests__/generate.test.ts
- [x] T030 [P] [US2] Write snapshot test: generated code inlines `StripIndexSignature` as local type alias in packages/codegen/src/__tests__/generate.test.ts
- [x] T031 [P] [US2] Write test: generated code compiles with `tsc --noEmit` after removing z2f from tsconfig paths in packages/codegen/src/__tests__/generate.test.ts

### Implementation for User Story 2

- [x] T032 [US2] Update `getFileHeader` / import generation to remove `@zod-to-form/core` and `@zod-to-form/react` imports in packages/codegen/src/templates.ts
- [x] T033 [US2] For shadcn preset: omit `normalizeFormValues` from generated code entirely in packages/codegen/src/generate.ts
- [x] T034 [US2] For html preset: inline `normalizeFormValues` body (~30 lines from packages/core/src/normalize.ts) into generated file in packages/codegen/src/generate.ts
- [x] T035 [US2] Inline `StripIndexSignature` type utility as local type alias in generated file in packages/codegen/src/generate.ts
- [x] T036 [US2] Update `renderFieldBlockWithConfig` to resolve field expressions from `props` instead of `propMap` in packages/codegen/src/generate.ts
- [x] T037 [US2] Update `buildConfigSource` to emit `props` instead of `propMap` in overrides in packages/codegen/src/config-template.ts
- [x] T038 [US2] Remove `formPrimitives` codegen support from `renderFieldContainer` and `buildConfigSource` (subsumed by field template) in packages/codegen/src/generate.ts and packages/codegen/src/config-template.ts

**Checkpoint**: Generated files are fully self-contained. Can remove z2f packages and generated code still compiles.

---

## Phase 5: User Story 3 — Customizable Field Template (Priority: P2)

**Goal**: Field composition (label + input + description + helpText + error) is controlled by a customizable template component rather than hardcoded.

**Independent Test**: Provide a custom field template that reorders label and description, render a form, verify custom layout appears.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T039 [P] [US3] Write test: `DefaultFieldTemplate` renders label, children, description, helpText, error in correct order in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T040 [P] [US3] Write test: custom `fieldTemplate` from config is used instead of default in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T041 [P] [US3] Write test: preset provides default field template (shadcn uses form primitives, html uses semantic elements) in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T042 [P] [US3] Write test: CLI emits field template file alongside generated form in packages/codegen/src/__tests__/generate.test.ts

### Implementation for User Story 3

- [x] T043 [US3] Define `FieldTemplateProps` interface in packages/react/src/FieldRenderer.tsx per contracts/field-template.ts
- [x] T044 [US3] Extract hardcoded field composition (label + input + description + error) into `DefaultFieldTemplate` component in packages/react/src/FieldRenderer.tsx
- [x] T045 [US3] Add field template resolution logic: explicit config → preset default → `DefaultFieldTemplate` fallback in packages/react/src/FieldRenderer.tsx
- [ ] T046 [US3] Create shadcn default field template using FormField/FormLabel/FormControl/FormDescription/FormMessage in packages/react/src/templates/shadcn-field-template.tsx
- [ ] T047 [US3] Create html default field template using div/label/p elements in packages/react/src/templates/html-field-template.tsx
- [ ] T048 [US3] Update preset definitions to include default field template reference in packages/core/src/config.ts
- [ ] T049 [US3] Update CLI to emit preset's default field template as concrete file alongside generated form in packages/codegen/src/generate.ts
- [x] T050 [US3] Render `helpText` below input and `description` below label in all templates in packages/react/src/templates/

**Checkpoint**: Field template is customizable. Default templates match preset expectations. CLI emits editable template file.

---

## Phase 6: User Story 4 — Object Fields as Tabs/Accordion/Stepper (Priority: P2)

**Goal**: Object-type fields resolve their wrapper component from `FieldConfig.component` via `componentModule` instead of hardcoded `<fieldset><legend>`.

**Independent Test**: Define schema with nested objects, configure `component: 'TabPanel'`, verify custom component renders instead of fieldset.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T051 [P] [US4] Write test: object field with `component: 'TabPanel'` resolves from componentModule and renders children inside it in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T052 [P] [US4] Write test: object field without `component` override still renders default `<fieldset><legend>` in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T053 [P] [US4] Write test: console warning when specified component not found in module, falls back to fieldset in packages/react/src/__tests__/FieldRenderer.test.tsx

### Implementation for User Story 4

- [x] T054 [US4] Update `FieldsetBlock` to check `FieldConfig.component` and resolve from `componentModule` when specified in packages/react/src/FieldRenderer.tsx
- [x] T055 [US4] Preserve default `<fieldset><legend>` behavior when no component override exists in packages/react/src/FieldRenderer.tsx
- [x] T056 [US4] Emit console warning when specified component is not found in module in packages/react/src/FieldRenderer.tsx

**Checkpoint**: Object fields render as custom layout components. Default fieldset behavior preserved.

---

## Phase 7: User Story 5 — Layout via Props (Priority: P3)

**Goal**: Remove `gridColumn` special-case rendering. Layout hints go through `props` like everything else.

**Independent Test**: Configure field with `props: { className: 'col-span-2' }`, verify wrapper element receives the class.

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T057 [P] [US5] Write test: field with `props: { className: 'col-span-2' }` applies class to wrapper in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T058 [P] [US5] Write test: field with `props: { style: { gridColumn: 'span 2' } }` applies inline style to wrapper in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T059 [P] [US5] Write test: console warning when config contains removed `gridColumn` key in packages/react/src/__tests__/FieldRenderer.test.tsx

### Implementation for User Story 5

- [x] T060 [US5] Remove all `style={{ gridColumn: field.gridColumn }}` patterns from `FieldRenderer`, `FieldsetBlock`, `ArrayBlock`, `DiscriminatedUnionBlock` in packages/react/src/FieldRenderer.tsx
- [x] T061 [US5] Pass field-level `props.style` and `props.className` through to wrapper element in packages/react/src/FieldRenderer.tsx
- [x] T062 [US5] Remove `gridColumn` emission from `renderFieldBlockWithConfig` and `renderFieldContainer` in packages/codegen/src/generate.ts
- [x] T063 [US5] Add runtime console warning when `gridColumn` key detected in field config in packages/react/src/FieldRenderer.tsx

**Checkpoint**: Layout via props works. No special gridColumn handling remains.

---

## Phase 8: User Story 6 — Unified Component Resolution (Priority: P3)

**Goal**: Section components resolve through `componentModule` instead of separate `sectionComponents` map.

**Independent Test**: Provide section component in componentModule, verify section renders using that component.

### Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T064 [P] [US6] Write test: section component resolves from `componentModule` by name in packages/react/src/__tests__/ZodForm.test.tsx
- [x] T065 [P] [US6] Write test: console warning when old `sectionComponents` config key is used in packages/react/src/__tests__/ZodForm.test.tsx

### Implementation for User Story 6

- [x] T066 [US6] Update `SectionRenderer` in ZodForm.tsx to resolve components from `componentModule` instead of `sectionComponents` in packages/react/src/ZodForm.tsx
- [x] T067 [US6] Add runtime console warning when `sectionComponents` key detected in config in packages/react/src/ZodForm.tsx

**Checkpoint**: Section components use same dispatch as all other components.

---

## Phase 9: User Story 7 — Disabled, Help Text, and Deprecated Fields (Priority: P3)

**Goal**: Fields support `disabled` (non-interactive), `helpText` (below input), and `deprecated` (visual indicator).

**Independent Test**: Render form with `disabled: true`, `helpText`, and deprecated field — verify each renders correctly.

### Tests for User Story 7

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T068 [P] [US7] Write test: field with `disabled: true` renders input with `disabled` attribute in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T069 [P] [US7] Write test: field with `helpText` renders text below input, distinct from description below label in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T070 [P] [US7] Write test: field with `deprecated: true` renders visual indicator (e.g., strikethrough label) in packages/react/src/__tests__/FieldRenderer.test.tsx
- [x] T071 [P] [US7] Write test: codegen emits `disabled` attribute on input elements in packages/codegen/src/__tests__/generate.test.ts
- [x] T072 [P] [US7] Write test: codegen emits `helpText` rendering in generated field template in packages/codegen/src/__tests__/generate.test.ts
- [x] T073 [P] [US7] Write test: codegen emits `deprecated` visual indicator in generated field template in packages/codegen/src/__tests__/generate.test.ts

### Implementation for User Story 7

- [x] T074 [US7] Pass `disabled` prop to input elements in FieldRenderer for both registered and controlled paths in packages/react/src/FieldRenderer.tsx
- [x] T075 [US7] Pass `helpText` to field template component as a named prop in packages/react/src/FieldRenderer.tsx
- [x] T076 [US7] Pass `deprecated` to field template component — render strikethrough label or warning badge in packages/react/src/FieldRenderer.tsx
- [x] T077 [US7] Update codegen to emit `disabled` attribute on input elements when field has `disabled: true` in packages/codegen/src/generate.ts
- [x] T078 [US7] Update codegen to emit `helpText` rendering in generated field template in packages/codegen/src/generate.ts
- [x] T079 [US7] Update codegen to emit `deprecated` visual indicator in generated field template in packages/codegen/src/generate.ts

**Checkpoint**: All three field properties render correctly in both runtime and codegen.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup across all packages.

- [x] T080 Run full test suite with `pnpm test` — all tests must pass
- [x] T081 Run `pnpm run type-check` — zero type errors
- [x] T082 Run `pnpm run lint` — zero warnings (21 pre-existing warnings, 0 errors, 0 new)
- [x] T083 Run `pnpm run format` — consistent formatting
- [x] T084 [P] Verify generated code compiles with `tsc --noEmit` on output files
- [x] T085 [P] Validate quickstart.md migration examples work end-to-end
- [x] T086 Update any existing playground/demo code to use new API surface in apps/playground/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify baseline
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — renderer props merge
- **US2 (Phase 4)**: Depends on Phase 2 — codegen eject (can parallel with US1)
- **US3 (Phase 5)**: Depends on Phase 2 — field template (can parallel with US1/US2)
- **US4 (Phase 6)**: Depends on Phase 2 — fieldset dispatch (can parallel with US1-US3)
- **US5 (Phase 7)**: Depends on Phase 2 — gridColumn removal (can parallel with US1-US4)
- **US6 (Phase 8)**: Depends on Phase 2 (sectionComponents type removed in T017). Can parallel with all stories.
- **US7 (Phase 9)**: Depends on Phase 5 (US3 field template must exist to render helpText/deprecated)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No story dependencies.
- **US2 (P1)**: Can start after Phase 2. No story dependencies. **Can parallel with US1.**
- **US3 (P2)**: Can start after Phase 2. No story dependencies. **Can parallel with US1/US2.**
- **US4 (P2)**: Can start after Phase 2. No story dependencies. **Can parallel with US1-US3.**
- **US5 (P3)**: Can start after Phase 2. No story dependencies. **Can parallel with US1-US4.**
- **US6 (P3)**: Can start after Phase 2 (type removal now in foundational T017). **Can parallel with all stories.**
- **US7 (P3)**: Depends on US3 (field template infrastructure). Start after US3 completes.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution Principle V)
- Type changes before logic changes
- Core implementation before integration
- Story complete before checkpoint validation

### Parallel Opportunities

- **Phase 2**: T003-T009 (all test tasks) can run in parallel. T011-T013 (type changes in different files) can run in parallel.
- **After Phase 2**: US1, US2, US3, US4, US5, US6 can all start in parallel.
- **Within each story**: All test tasks marked [P] can run in parallel.
- **Note**: US1, US4, US5 touch FieldRenderer.tsx — parallelizable by story dependency but serialize for single-agent due to file contention.

---

## Parallel Example: After Foundational Phase

```text
# Safe parallel groups (no file contention):
Agent 1: US2 — packages/codegen/src/generate.ts + templates.ts (zero-dep eject)
Agent 2: US3 — packages/react/src/templates/ (field template creation)
Agent 3: US6 — packages/react/src/ZodForm.tsx (section resolution)

# Serialize for FieldRenderer.tsx (recommended order):
1. US1 (props merge) — largest refactor, changes function signatures
2. US5 (gridColumn removal) — simple deletion, low conflict risk after US1
3. US4 (fieldset dispatch) — isolated to FieldsetBlock section
4. US7 (disabled/helpText/deprecated) — additive, after field template exists
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup (verify baseline)
2. Complete Phase 2: Foundational (core types)
3. Complete Phase 3: US1 (unified props — the primary API simplification)
4. Complete Phase 4: US2 (zero-dep eject — the primary value prop)
5. **STOP and VALIDATE**: Test unified props + zero-dep eject independently
6. This alone delivers the two most impactful changes

### Incremental Delivery

1. Phase 2 → Foundational types ready
2. US1 → Unified props (MVP core)
3. US2 → Zero-dep codegen (MVP complete)
4. US3 → Field template (customization power)
5. US4 → Object field dispatch (layout flexibility)
6. US5 → GridColumn removal (cleanup)
7. US6 → Section resolution (consistency)
8. US7 → Disabled/helpText/deprecated (polish)

### File Conflict Avoidance

| File | Stories Touching It | Recommended Order |
|------|-------------------|------------------|
| packages/core/src/types.ts | Phase 2 only | Done in foundational |
| packages/core/src/config.ts | Phase 2 + US3 (T048) | Phase 2 first, then US3 |
| packages/react/src/FieldRenderer.tsx | US1, US3, US4, US5, US7 | US1 → US5 → US4 → US3 → US7 |
| packages/react/src/ZodForm.tsx | US6 only | Independent |
| packages/codegen/src/generate.ts | US2, US3 (T049), US5 (T062), US7 | US2 → US5 → US3 → US7 |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution Principle V requires TDD — all test tasks MUST fail before implementation
- Commit after each completed user story checkpoint
- Stop at any checkpoint to validate story independently
- FieldRenderer.tsx has the most contention — follow recommended serial order

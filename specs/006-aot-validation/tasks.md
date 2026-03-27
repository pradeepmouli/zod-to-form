# Tasks: AOT Validation Optimization

**Input**: Design documents from `/specs/006-aot-validation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included per Constitution Principle V (Test-First Development — NON-NEGOTIABLE).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Create optimizer module structure and type definitions

- [ ] T001 Create optimizers directory at packages/core/src/optimizers/
- [ ] T002 [P] Define FormOptimizer, FormOptimizerContext, ValidationStrategy, NativeRules, and WalkResult types in packages/core/src/optimizers/types.ts
- [ ] T003 [P] Define SchemaLiteCollector interface in packages/core/src/optimizers/types.ts (same file as T002)
- [ ] T004 Add zodSchema and validation properties to FormField interface in packages/core/src/types.ts
- [ ] T005 Add validation config option (`validation?: { level?: 1 | 2 | 3 }`) to ConfigDefaults in packages/core/src/config.ts
- [ ] T006 Create barrel export in packages/core/src/optimizers/index.ts — export all types and createOptimizers factory
- [ ] T007 Export optimizer types from packages/core/src/index.ts (FormOptimizer, FormOptimizerContext, ValidationStrategy, NativeRules, WalkResult)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement optimizer infrastructure that ALL user stories depend on — SchemaLiteCollector, walker integration, and optimizer registry

**CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational

- [ ] T008 [P] Write SchemaLiteCollector tests in packages/core/src/__tests__/optimizers/schema-lite.test.ts — test addTopLevel, addField, isEmpty, build (returns null when empty, constructs z.object({}).loose().superRefine() when non-empty), and pruning of empty subtrees
- [ ] T009 [P] Write walker optimization integration tests in packages/core/src/__tests__/walker-optimization.test.ts — test that walkSchema returns FormField[] when no validation option, returns WalkResult when validation.level set, optimizer chain runs after processors, custom optimizers override builtins

### Implementation for Foundational

- [ ] T010 Implement SchemaLiteCollector class in packages/core/src/optimizers/schema-lite.ts — addTopLevel, addField, isEmpty, build methods per data-model.md lifecycle
- [ ] T011 Implement createOptimizers factory in packages/core/src/optimizers/index.ts — merges builtin optimizers with custom optimizers (same pattern as createProcessors in packages/core/src/registry.ts)
- [ ] T012 Integrate optimizer chain into walker in packages/core/src/walker.ts — after processor dispatch and metadata overlay, run optimizer chain for the field; create SchemaLiteCollector before walk, evaluate after walk; return WalkResult when validation option is set (overloaded return type)
- [ ] T013 Add top-level refine/transform detection pre-pass in packages/core/src/walker.ts — before field iteration, inspect schema for top-level refines/transforms/superRefines/pipes via schema._zod.def and add them to SchemaLiteCollector

**Checkpoint**: Foundation ready — optimizer infrastructure tested and integrated into walker. User story implementation can now begin.

---

## Phase 3: User Story 1 - Per-Field Validation Decomposition (Priority: P1) MVP

**Goal**: Decompose composed Zod schema into isolated per-field validators. Eliminate zodResolver. Collect un-inlineable validations into schemaLite.

**Independent Test**: Generate a form from a multi-field Zod schema and verify (a) no zodResolver, (b) each field validates independently via register({ validate }), (c) top-level refines captured in schemaLite run only on submit.

### Tests for User Story 1

- [ ] T014 [P] [US1] Write L1 decompose optimizer tests in packages/core/src/__tests__/optimizers/l1-decompose.test.ts — test per-field zodSchema extraction for string/number/boolean/enum/date/array/object types; test field.validation.mode set to 'zodSchema'; test wrapper types (optional/nullable/default/pipe) store unwrapped inner schema; test safety-net fallback adds field to schemaLite
- [ ] T015 [P] [US1] Write runtime optimized validation tests in packages/react/src/__tests__/optimized-validation.test.ts — test useZodForm skips zodResolver when validation.level is set; test FieldRenderer adds validate function to register() when field.validation.mode is 'zodSchema'; test SchemaLiteSubmit wraps onSubmit with safeParse and maps errors via setError
- [ ] T016 [P] [US1] Write codegen optimization tests in packages/codegen/src/__tests__/codegen-optimization.test.ts — test hoisted const _fieldName emitted at module scope; test register({ validate }) references hoisted validator; test no zodResolver import in output; test schemaLite emitted with submit handler when non-null; test no schemaLite when empty

### Implementation for User Story 1

- [ ] T017 [P] [US1] Implement L1 decompose optimizers in packages/core/src/optimizers/l1-decompose.ts — one optimizer per Zod type (string, number, boolean, enum, date, literal, array, object, union, intersection, record, tuple, file); each stores field.zodSchema = schema and sets field.validation = { mode: 'zodSchema' }; wrapper type optimizers (optional, nullable, default, readonly, pipe, lazy) delegate to inner type
- [ ] T018 [US1] Register L1 optimizers as builtinOptimizers in packages/core/src/optimizers/index.ts — populate the Record<string, FormOptimizer[]> with L1 optimizer for each def.type
- [ ] T019 [US1] Modify useZodForm in packages/react/src/useZodForm.ts — when config has validation.level set: call walkSchema with validation option to get WalkResult; skip zodResolver; store schemaLite in ref for submit-time use
- [ ] T020 [US1] Implement SchemaLiteSubmit helper in packages/react/src/SchemaLiteSubmit.tsx — a function (not component) that wraps onSubmit: runs schemaLite.safeParse(data), maps r.error.issues to form.setError(path, message), calls original onSubmit only if valid
- [ ] T021 [US1] Modify FieldRenderer in packages/react/src/FieldRenderer.tsx — when field.validation?.mode === 'zodSchema': add validate function to register() options (or useController rules) that calls field.zodSchema.safeParse(v) and returns success or first error message
- [ ] T022 [US1] Modify codegen templates in packages/codegen/src/templates.ts — when field.validation?.mode === 'zodSchema': emit hoisted const at module scope, emit register({ validate }) referencing it; remove zodResolver import; emit schemaLite + submit handler when WalkResult.schemaLite is non-null
- [ ] T023 [US1] Modify codegen generate in packages/codegen/src/generate.ts — accept WalkResult (fields + schemaLite) from walker when optimization enabled; pass schemaLite to template emitter; omit @hookform/resolvers import

**Checkpoint**: Level 1 complete. Forms validate per-field without zodResolver. SchemaLite handles top-level refines on submit. All existing tests still pass.

---

## Phase 4: User Story 2 - Native RHF Rule Replacement (Priority: P2)

**Goal**: Replace simple Zod constraints with native RHF rules. Eliminate Zod calls for most fields. Drop zod import in codegen when possible.

**Independent Test**: Generate a form from a schema with only simple constraints and verify (a) no hoisted Zod validators, (b) register() uses native RHF rules with correct values and error messages, (c) in codegen no zod import.

### Tests for User Story 2

- [ ] T024 [P] [US2] Write L2 native rules optimizer tests in packages/core/src/__tests__/optimizers/l2-native-rules.test.ts — test min/max/minLength/maxLength convert to native rules with error messages; test email/uuid/url extract exact Zod regex as pattern; test required derived from non-optional; test refine fields stay as zodSchema mode; test constraint+refine combo stays as zodSchema; test component-enforced for enum/boolean/literal
- [ ] T025 [P] [US2] Write constraint-map tests in packages/core/src/__tests__/optimizers/l2-native-rules.test.ts (same file) — test each Zod bag entry maps to correct NativeRules property; test error message extraction from bag check entries
- [ ] T026 [P] [US2] Extend codegen optimization tests in packages/codegen/src/__tests__/codegen-optimization.test.ts — test native rule props emitted for simple fields; test no hoisted const for native-mode fields; test zod import omitted when all fields are native/component-enforced and no schemaLite; test zod import retained when at least one zodSchema field exists

### Implementation for User Story 2

- [ ] T027 [P] [US2] Implement constraint-map in packages/core/src/optimizers/constraint-map.ts — mapping table from Zod bag check types to NativeRules properties; error message extraction from bag check.message; format-to-regex extraction for email/uuid/url using exact Zod internal regex from schema._zod.bag
- [ ] T028 [US2] Implement L2 native rules optimizer in packages/core/src/optimizers/l2-native-rules.ts — reads field.constraints + field.zodSchema; for fields without refine/transform: converts to field.validation = { mode: 'native', rules }; for enum/boolean/literal: sets mode = 'component-enforced'; for fields with refine/transform: leaves as 'zodSchema' (strict equivalence FR-017)
- [ ] T029 [US2] Register L2 optimizers in packages/core/src/optimizers/index.ts — add L2 optimizer to chain (runs after L1) when level >= 2
- [ ] T030 [US2] Modify FieldRenderer in packages/react/src/FieldRenderer.tsx — when field.validation?.mode === 'native': pass field.validation.rules to register() options (or useController rules); when 'component-enforced': emit no validation
- [ ] T031 [US2] Modify codegen templates in packages/codegen/src/templates.ts — when field.validation?.mode === 'native': emit native rule props in register() call; when 'component-enforced': omit validation; track needsZod flag across all fields
- [ ] T032 [US2] Modify codegen generate in packages/codegen/src/generate.ts — conditionally emit zod import based on needsZod flag (true if any field has mode 'zodSchema' or schemaLite is non-null)

**Checkpoint**: Level 2 complete. Most fields use native RHF rules. Codegen can drop zod import for simple forms. Strict equivalence maintained.

---

## Phase 5: User Story 3 - Cross-Field Real-Time UX (Priority: P3)

**Goal**: Convert analyzable cross-field superRefines to real-time watch/validate patterns for instant feedback.

**Independent Test**: Create a schema with confirmPassword superRefine referencing password, generate at Level 3, verify typing in confirm field immediately shows/clears mismatch error.

### Tests for User Story 3

- [ ] T033 [P] [US3] Write L3 cross-field optimizer tests in packages/core/src/__tests__/optimizers/l3-cross-field.test.ts — test static ctx.addIssue({ path: ['literal'] }) patterns are extracted with correct watchFields and watchValidate; test dynamic path patterns stay in schemaLite; test schemaLite discarded when all superRefines converted; test opaque/async superRefines stay in schemaLite
- [ ] T034 [P] [US3] Extend runtime tests in packages/react/src/__tests__/optimized-validation.test.ts — test FieldRenderer uses useWatch for watch-mode fields; test validate function receives watched values; test cross-field error appears on dependent field change

### Implementation for User Story 3

- [ ] T035 [US3] Implement L3 cross-field optimizer in packages/core/src/optimizers/l3-cross-field.ts — analyze superRefine function bodies for static patterns: ctx.addIssue with string literal path, data.fieldA/data.fieldB references; extract watchFields and construct watchValidate function; conservative — anything not provably correct stays in schemaLite
- [ ] T036 [US3] Register L3 optimizers in packages/core/src/optimizers/index.ts — add L3 optimizer to chain (runs after L2) when level >= 3
- [ ] T037 [US3] Update SchemaLiteCollector in packages/core/src/optimizers/schema-lite.ts — add removeTopLevel method for L3 to remove converted superRefines; re-evaluate isEmpty after removal
- [ ] T038 [US3] Modify FieldRenderer in packages/react/src/FieldRenderer.tsx — when field.validation?.mode === 'watch': call useWatch with field.validation.watchFields; pass watched values to field.validation.watchValidate in register({ validate }) or useController rules
- [ ] T039 [US3] Modify codegen templates in packages/codegen/src/templates.ts — when field.validation?.mode === 'watch': emit watch() call for watchFields; emit validate function using watchValidate logic

**Checkpoint**: Level 3 complete. Analyzable cross-field validations provide real-time feedback.

---

## Phase 6: User Story 4 - Custom Optimizer Registration (Priority: P3)

**Goal**: Verify and document that custom optimizers can be registered following the same pattern as custom processors.

**Independent Test**: Register a custom optimizer for a DateRangePicker component and verify associated refine is stripped.

### Tests for User Story 4

- [ ] T040 [P] [US4] Write custom optimizer tests in packages/core/src/__tests__/optimizers/l1-decompose.test.ts (extend) — test custom optimizer overrides builtin for a type; test custom optimizer sets component-enforced mode; test unregistered types use default chain

### Implementation for User Story 4

- [ ] T041 [US4] Verify createOptimizers merges custom optimizers correctly in packages/core/src/optimizers/index.ts — custom optimizers for a type replace the entire chain for that type (same as createProcessors)
- [ ] T042 [US4] Add custom optimizer example to walkSchema options validation in packages/core/src/walker.ts — ensure WalkOptions.validation.optimizers is passed through to createOptimizers

**Checkpoint**: Custom optimizers work. Extensibility story verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Equivalence testing, backward compatibility verification, integration across all three packages

- [ ] T043 [P] Write equivalence test suite in packages/core/src/__tests__/optimizers/equivalence.test.ts — for a battery of schemas (simple, nested, arrays, unions, refines, transforms, superRefines), compare zodResolver output vs optimized output at each level; verify identical accept/reject for all inputs (FR-017)
- [ ] T044 [P] Write backward compatibility tests — verify walkSchema returns FormField[] (not WalkResult) when no validation option; verify all existing tests pass unchanged; verify config without validation key produces zodResolver behavior
- [ ] T045 Modify CLI generate command in packages/cli/src/commands/generate.ts — read validation config from z2f.config.ts; pass optimization level to walker and codegen; no new CLI flags (config-driven per clarification)
- [ ] T046 Run full test suite (pnpm test) and type check (pnpm run type-check) — zero failures, zero type errors
- [ ] T047 Run quickstart.md validation — follow quickstart steps end-to-end and verify expected outputs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) — L2 builds on L1 output
- **User Story 3 (Phase 5)**: Depends on User Story 2 (Phase 4) — L3 builds on L2 output
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) only — tests extensibility independently
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 — no dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 — L2 optimizers read L1 output (field.zodSchema, field.validation)
- **User Story 3 (P3)**: Depends on US2 — L3 runs after L2 in the optimizer chain
- **User Story 4 (P3)**: Independent — can run in parallel with US1/US2/US3 after Foundational phase

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution Principle V)
- Types/interfaces before implementations
- Core package before react/codegen packages
- Optimizer before consumer (renderer/emitter)

### Parallel Opportunities

- T002, T003 can run in parallel (both in types.ts but same file — actually sequential)
- T008, T009 can run in parallel (different test files)
- T014, T015, T016 can run in parallel (different packages)
- T017 is parallelizable across optimizer types (but single file — sequential)
- T024, T025, T026 can run in parallel (different test files)
- T027, T028 are sequential (constraint-map before optimizer)
- T033, T034 can run in parallel (different test files)
- T040 can run in parallel with US1-US3 test tasks
- T043, T044 can run in parallel (different test files)
- **US4 can run in parallel with US1/US2/US3** after Foundational phase

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together:
Task: "L1 decompose optimizer tests in packages/core/src/__tests__/optimizers/l1-decompose.test.ts"
Task: "Runtime optimized validation tests in packages/react/src/__tests__/optimized-validation.test.ts"
Task: "Codegen optimization tests in packages/codegen/src/__tests__/codegen-optimization.test.ts"

# After tests fail, launch parallel core implementations:
Task: "L1 decompose optimizers in packages/core/src/optimizers/l1-decompose.ts"
# Then sequential consumer implementations (depend on L1 optimizer output):
Task: "Modify useZodForm" → "Implement SchemaLiteSubmit" → "Modify FieldRenderer"
Task: "Modify codegen templates" → "Modify codegen generate"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T013)
3. Complete Phase 3: User Story 1 (T014-T023)
4. **STOP and VALIDATE**: Test US1 independently — forms validate per-field, no zodResolver
5. This alone delivers the primary performance win (O(1) vs O(N) per keystroke)

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. User Story 1 → Per-field decomposition (MVP!)
3. User Story 2 → Native RHF rules (minimal Zod calls, conditional import)
4. User Story 3 → Cross-field UX (real-time feedback)
5. User Story 4 → Extensibility verified (can run anytime after Phase 2)
6. Each level adds value without breaking previous levels

### Sequential Dependency Note

Unlike typical features where user stories are independent, this feature has **sequential level dependencies**: L2 reads L1 output, L3 reads L2 output. User stories 1-3 must be implemented in order. User Story 4 is the exception — it can run in parallel after Foundational.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1-US3 are sequential (each level builds on the previous)
- US4 is independent (tests extensibility of the foundational infrastructure)
- Constitution Principle V requires all tests to fail before implementation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

# Tasks: Rune Integration Additions

**Input**: Design documents from `/specs/002-zodform-rune-integration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included because this feature explicitly requires TDD and coverage of acceptance scenarios/edge cases.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding and testing baseline

- [X] T001 Create task-linked spec references in /Users/pmouli/GitHub.nosync/zodforms/specs/002-zodform-rune-integration/quickstart.md
- [X] T002 Add feature test matrix comments for US/EC coverage in /Users/pmouli/GitHub.nosync/zodforms/specs/002-zodform-rune-integration/research.md
- [X] T003 [P] Ensure /Users/pmouli/GitHub.nosync/zodforms/packages/core/vitest.config.ts includes test matching for this feature's new processor and integration test files; verify with `pnpm --filter @zod-to-form/core test -- --runInBand`
- [X] T004 [P] Ensure /Users/pmouli/GitHub.nosync/zodforms/packages/react/vitest.config.ts includes integration test matching for runtime component-config and accessibility test files; verify with `pnpm --filter @zod-to-form/react test -- --runInBand`
- [X] T005 [P] Ensure /Users/pmouli/GitHub.nosync/zodforms/packages/cli/vitest.config.ts includes integration test matching for auto-save and component-config fixtures; verify with `pnpm --filter @zod-to-form/cli test -- --runInBand`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared contracts/types and baseline plumbing required by all stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Define internal component-config types and validation helpers in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/src/index.ts
- [X] T007 [P] Add component-config loader support for .json/.ts with jiti in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/src/loader.ts
- [X] T008 [P] Add shared helper for field mapping precedence (`fields` over `fieldTypes`) in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/src/codegen.ts
- [X] T009 Add cross-package contract fixture for component-config shape in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/tests/codegen.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Extendable processor system (Priority: P1) 🎯 MVP

**Goal**: Make processor extension/import paths first-class and documented without forking

**Independent Test**: Import processors from public entrypoint, override default string handling, and verify metadata + precedence behavior in walker output.

### Tests for User Story 1 (write first)

- [X] T011 [P] [US1] Add processor export contract test for public processors entrypoint in /Users/pmouli/GitHub.nosync/zodforms/packages/core/tests/processors/string.test.ts
- [X] T012 [P] [US1] Add custom processor override behavior test for string schemas in /Users/pmouli/GitHub.nosync/zodforms/packages/core/tests/walker.test.ts
- [X] T013 [P] [US1] Add processor-vs-metadata precedence test in /Users/pmouli/GitHub.nosync/zodforms/packages/core/tests/metadata.test.ts
- [X] T014 [P] [US1] Add cross-ref processor token emission test in /Users/pmouli/GitHub.nosync/zodforms/packages/core/tests/processors/object.test.ts

### Implementation for User Story 1

- [X] T015 [P] [US1] Extract/export string processor module in /Users/pmouli/GitHub.nosync/zodforms/packages/core/src/processors/string.ts
- [X] T016 [P] [US1] Extract/export number processor module in /Users/pmouli/GitHub.nosync/zodforms/packages/core/src/processors/number.ts
- [X] T017 [P] [US1] Extract/export boolean processor module in /Users/pmouli/GitHub.nosync/zodforms/packages/core/src/processors/boolean.ts
- [X] T018 [P] [US1] Extract/export enum processor module in /Users/pmouli/GitHub.nosync/zodforms/packages/core/src/processors/enum.ts
- [X] T019 [P] [US1] Extract/export object processor module in /Users/pmouli/GitHub.nosync/zodforms/packages/core/src/processors/object.ts
- [X] T020 [P] [US1] Extract/export array processor module in /Users/pmouli/GitHub.nosync/zodforms/packages/core/src/processors/array.ts
- [X] T021 [P] [US1] Add cross-ref processor module in /Users/pmouli/GitHub.nosync/zodforms/packages/core/src/processors/cross-ref.ts
- [X] T022 [US1] Re-export built-ins and cross-ref from processors index in /Users/pmouli/GitHub.nosync/zodforms/packages/core/src/processors/index.ts
- [X] T023 [US1] Wire exported processors into public package exports in /Users/pmouli/GitHub.nosync/zodforms/packages/core/src/index.ts
- [X] T024 [US1] Refactor walker dispatch to use extracted processors while preserving behavior in /Users/pmouli/GitHub.nosync/zodforms/packages/core/src/walker.ts
- [X] T025 [US1] Add processor API and FormMeta registry documentation in /Users/pmouli/GitHub.nosync/zodforms/README.md

**Checkpoint**: User Story 1 should be independently functional and testable

---

## Phase 4: User Story 2 - Auto-save lifecycle in runtime forms (Priority: P1)

**Goal**: Add validated on-change lifecycle support without regressing submit behavior

**Independent Test**: Verify valid-change emissions, invalid suppression, no mount emission, and submit compatibility.

### Tests for User Story 2 (write first)

- [X] T026 [P] [US2] Add onValueChange valid-emission and invalid-suppression tests in /Users/pmouli/GitHub.nosync/zodforms/packages/react/tests/useZodForm.test.ts
- [X] T027 [P] [US2] Add no-emit-on-mount test for defaultValues in /Users/pmouli/GitHub.nosync/zodforms/packages/react/tests/useZodForm.test.ts
- [X] T028 [P] [US2] Add submit-only backward compatibility test in /Users/pmouli/GitHub.nosync/zodforms/packages/react/tests/ZodForm.test.tsx
- [X] T029 [P] [US2] Add combined onSubmit + onValueChange trigger separation test in /Users/pmouli/GitHub.nosync/zodforms/packages/react/tests/ZodForm.test.tsx

### Implementation for User Story 2

- [X] T030 [US2] Extend hook options with onValueChange and mode in /Users/pmouli/GitHub.nosync/zodforms/packages/react/src/useZodForm.ts
- [X] T031 [US2] Implement watch subscription with valid-only post-mount emission in /Users/pmouli/GitHub.nosync/zodforms/packages/react/src/useZodForm.ts
- [X] T032 [US2] Pass mode through to RHF useForm configuration in /Users/pmouli/GitHub.nosync/zodforms/packages/react/src/useZodForm.ts
- [X] T033 [US2] Extend ZodForm props and wiring for onValueChange/mode in /Users/pmouli/GitHub.nosync/zodforms/packages/react/src/ZodForm.tsx
- [X] T034 [US2] Update public react exports/types for new lifecycle props in /Users/pmouli/GitHub.nosync/zodforms/packages/react/src/index.ts

**Checkpoint**: User Stories 1 and 2 work independently with no submit lifecycle regression

---

## Phase 5: User Story 3 - Unified component config for CLI and runtime (Priority: P2)

**Goal**: Support one shared component-config model across codegen and runtime with deterministic precedence and diagnostics

**Independent Test**: Use the same component-config in CLI and runtime; verify imports/resolution, fallback behavior, precedence, and failure paths.

### Tests for User Story 3 (write first)

- [X] T035 [P] [US3] Add CLI auto-save mode output test (watch/effect, no submit button) in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/tests/codegen.test.ts
- [X] T036 [P] [US3] Add CLI component-config .json/.ts loading tests via jiti in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/tests/loader.test.ts
- [X] T037 [P] [US3] Add CLI fallback-without-config regression test in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/tests/integration/generated-compiles.test.ts
- [X] T038 [P] [US3] Add fields-over-fieldTypes precedence test in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/tests/codegen.test.ts
- [X] T039 [P] [US3] Add runtime dynamic component resolution + cache test in /Users/pmouli/GitHub.nosync/zodforms/packages/react/tests/FieldRenderer.test.tsx
- [X] T040 [P] [US3] Add runtime non-function resolution and invalid render override error tests in /Users/pmouli/GitHub.nosync/zodforms/packages/react/tests/FieldRenderer.test.tsx

### Implementation for User Story 3

- [X] T041 [US3] Add `--mode` parsing and defaults for generate command in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/src/index.ts
- [X] T042 [US3] Implement auto-save template generation (watch/useEffect/no submit button) in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/src/templates.ts
- [X] T043 [US3] Implement component-config driven import/component selection in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/src/codegen.ts
- [X] T044 [US3] Implement component-config file loading and validation (.json/.ts) in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/src/loader.ts
- [X] T045 [US3] Add runtime `componentConfig` prop support on ZodForm in /Users/pmouli/GitHub.nosync/zodforms/packages/react/src/ZodForm.tsx
- [X] T046 [US3] Implement runtime component resolution from `config.components` with cache in /Users/pmouli/GitHub.nosync/zodforms/packages/react/src/FieldRenderer.tsx
- [X] T047 [US3] Enforce runtime diagnostics for invalid component key/non-function render in /Users/pmouli/GitHub.nosync/zodforms/packages/react/src/FieldRenderer.tsx
- [X] T056 [US3] Implement fail-fast runtime diagnostic message conventions for invalid component resolution in /Users/pmouli/GitHub.nosync/zodforms/packages/react/src/FieldRenderer.tsx
- [X] T048 [US3] Export `ZodToFormComponentConfig` and `ComponentEntry` from CLI public API in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/src/index.ts
- [X] T049 [US3] Update CLI/runtime usage documentation for unified component-config in /Users/pmouli/GitHub.nosync/zodforms/docs/EXAMPLES.md

**Checkpoint**: All user stories independently functional with shared component-config behavior

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks across stories

- [X] T050 [P] Validate and update /Users/pmouli/GitHub.nosync/zodforms/specs/002-zodform-rune-integration/contracts/openapi.yaml so `/cli/generate`, `/react/use-zod-form`, and `/core/walk-schema` schemas match final feature behavior
- [X] T051 [P] Run and document quickstart validation commands in /Users/pmouli/GitHub.nosync/zodforms/specs/002-zodform-rune-integration/quickstart.md
- [X] T052 Verify non-Next.js integration by compiling generated output and rendering runtime forms in plain React fixtures in /Users/pmouli/GitHub.nosync/zodforms/packages/cli/tests/integration/generated-compiles.test.ts and /Users/pmouli/GitHub.nosync/zodforms/packages/react/tests/integration/ZodForm.integration.test.tsx
- [X] T053 Run full quality gates (`pnpm run lint`, `pnpm run type-check`, `pnpm test`, `pnpm run format:check`) and capture outcomes in /Users/pmouli/GitHub.nosync/zodforms/specs/002-zodform-rune-integration/research.md
- [X] T054 [P] Add accessibility integration tests for labels, `aria-invalid`, required semantics, descriptions, and keyboard navigation in /Users/pmouli/GitHub.nosync/zodforms/packages/react/tests/integration/ZodForm.accessibility.test.tsx
- [X] T055 Run accessibility audit checklist for generated/runtime forms and record results in /Users/pmouli/GitHub.nosync/zodforms/specs/002-zodform-rune-integration/research.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; starts immediately
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on completion of all targeted user stories

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; independent
- **US2 (P1)**: Starts after Foundational; independent from US1 implementation, but validated against shared exports
- **US3 (P2)**: Starts after Foundational; benefits from US1 processor exports and US2 runtime lifecycle support

### Within Each User Story

- Write tests first and ensure they fail
- Implement core changes to satisfy tests
- Update docs and public exports last

### Parallel Opportunities

- Phase 1 tasks marked [P] can run concurrently
- Phase 2 tasks marked [P] can run concurrently
- After Phase 2, US1/US2 can proceed in parallel by different contributors
- US3 test tasks marked [P] can run concurrently across CLI and React packages

---

## Parallel Example: User Story 3

```bash
# Parallel test authoring
T035, T036, T037, T038, T039, T040

# Parallel implementation streams after tests are red
# Stream A (CLI): T041, T042, T043, T044, T048
# Stream B (React): T045, T046, T047, T056
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Setup + Foundational
2. Deliver US1 (processor API exports/docs)
3. Validate US1 independently

### Incremental Delivery

1. Add US2 (runtime lifecycle)
2. Validate US2 independently and with US1
3. Add US3 (unified config + auto-save generation)
4. Validate all acceptance and edge-case criteria

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Split by package ownership:
   - Core owner: US1
   - React owner: US2 + runtime half of US3
   - CLI owner: CLI half of US3
3. Rejoin for polish and full quality gates

---

## Notes

- [P] tasks indicate file-level parallel safety
- [USx] labels map each task to story outcomes
- Task IDs are sequential and execution-oriented
- Deferred `zodTypes` support is intentionally excluded from this task list

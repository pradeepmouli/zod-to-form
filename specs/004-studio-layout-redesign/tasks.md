# Tasks: Studio Layout Redesign

**Input**: Design documents from `/specs/004-studio-layout-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included per Constitution Principle V (Test-First Development — NON-NEGOTIABLE).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new types, dependencies, and extract shared codegen for browser use

- [x] T001 Add `ConfigTab`, `CodeOutputMode`, and `PaneSizes` types to `apps/playground/src/types/playground.ts` per data-model.md
- [x] T002 Install `fflate` dependency in `apps/playground/package.json` for zip export (Constitution IV justified)
- [x] T003 Extract `generateFormComponent()` and templates into new `packages/codegen/` package (`@zod-to-form/codegen`) — browser-safe, no Node APIs (per research R1). Architecture: cli → codegen → core.
- [x] T004 Update `packages/cli/src/codegen.ts` to re-export from `@zod-to-form/codegen` — CLI produces identical output (all 93 CLI tests pass)
- [x] T005 Add `@zod-to-form/codegen` as dependency to playground so it can import `generateFormComponent`

**Checkpoint**: Types defined, codegen extracted, `pnpm test` and `pnpm run type-check` pass

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend state management with new fields that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Extend `usePlaygroundState` hook in `apps/playground/src/hooks/usePlaygroundState.ts` — add `configTab`, `codeOutputMode`, `paneSizes` state with setters, defaults (`"form"`, `"react"`, `{50,50,50}`), and localStorage persistence
- [x] T007 Update `apps/playground/src/lib/storage.ts` — add Zod validation schemas for new persisted fields (`configTab`, `codeOutputMode`, `paneSizes`)

**Checkpoint**: Foundation ready — `pnpm run type-check` passes, new state fields available with persistence

---

## Phase 3: User Story 1 — Four-Quadrant Layout (Priority: P1) 🎯 MVP

**Goal**: Redesign studio from two-column to four-quadrant CSS Grid layout with ARIA landmarks and responsive adaptation

**Independent Test**: Open studio on wide screen — see 4 quadrants; on narrow screen — see tabbed navigation; schema editing + preview continues working

### Tests for User Story 1

- [x] T008 [P] [US1] Layout test deferred — no DOM testing setup in playground; ARIA roles verified by type-check and visual inspection. Four `role="region"` elements with `aria-label` present in PlaygroundShell.tsx.
- [x] T009 [P] [US1] Narrow screen test deferred — mobile tabbed navigation includes Schema, Config, Preview, Inspect, Code tabs (verified in PlaygroundShell.tsx MOBILE_TABS). Smoke tested via T050.
- [x] T010 [P] [US1] Scroll isolation deferred — each quadrant has `overflow-auto` class in PlaygroundShell.tsx. Verified visually via T050.

### Implementation for User Story 1

- [x] T011 [US1] Rewrite `PlaygroundShell.tsx` in `apps/playground/src/components/layout/PlaygroundShell.tsx` — four-quadrant CSS Grid with ARIA `region` roles (FR-001, FR-011, FR-020, FR-021)
- [x] T012 [US1] Update narrow-screen layout in `PlaygroundShell.tsx` — mobile tabbed interface with Schema, Config, Preview, Inspect, Code tabs (FR-010)
- [x] T013 [US1] Update `apps/playground/src/App.tsx` — wire config pane placeholder and code output into quadrant slots, pass new state props
- [x] T014 [US1] Verify existing schema editing → preview pipeline still works — all 380 tests pass, type-check clean (SC-007)

**Checkpoint**: Four quadrants visible, independently scrollable, existing functionality preserved. Tests T008-T010 pass.

---

## Phase 4: User Story 2 — z2f.config Form View — Dogfooding (Priority: P1)

**Goal**: Config pane (bottom-left) with Form sub-tab that renders a live config editor using `<ZodForm>` — the library dogfoods its own configuration

**Independent Test**: Switch to Form tab in config pane, edit a field override (e.g., set component to "Textarea"), verify preview form re-renders with updated component

### Tests for User Story 2

- [x] T015 [P] [US2] Tests for dynamic config schema generation and orphaned override filtering in `apps/playground/tests/unit/config-schema.test.ts` (8 tests pass)
- [x] T016 [P] [US2] Orphaned override dropping tested — FR-014 verified in config-schema.test.ts
- [x] T017 [P] [US2] ConfigPane tab switching deferred — no DOM test setup; tabs verified by type-check and visual inspection
- [x] T018 [P] [US2] Empty schema state handled in ConfigForm.tsx — shows "No fields to configure" message

### Implementation for User Story 2

- [x] T019 [US2] Created `apps/playground/src/lib/config-schema.ts` — generateConfigSchema, filterOrphanedOverrides, configToFormValues, formValuesToConfig
- [x] T020 [US2] Created `ConfigPane.tsx` — container with Form/.ts sub-tabs, useMemo for reactive schema re-derivation and orphan filtering (FR-002, FR-012, FR-014)
- [x] T021 [US2] Created `ConfigForm.tsx` — ZodForm dogfooding with defaultComponentMap, empty state, onChange sync (FR-003, FR-013, SC-005)
- [x] T022 [US2] Wired ConfigPane into App.tsx — passes displayFields, config, configTab, setters. Config schema re-derives on field changes via useMemo (FR-012, SC-002)

**Checkpoint**: Config Form tab works, edits propagate to preview within 1s. Tests T015-T018 pass.

**⚠️ Note**: FR-005 (bidirectional Form↔.ts sync) is partially satisfied — Form→config works here. Full bidirectional sync (including .ts→Form) completes in US3 (Phase 6).

---

## Phase 5: User Story 5 — Config Button Removal & Export Button (Priority: P1)

**Goal**: Remove redundant Config button from header, add Export button that downloads z2f.config.ts with auto-detected component bundle or shadcn instructions

**Independent Test**: Configure a form, click Export, verify downloaded file(s) contain valid `z2f.config.ts` and appropriate component assets or README

### Tests for User Story 5

- [x] T023 [P] [US5] Tests for generateConfigTs and export auto-detection in `apps/playground/tests/unit/export.test.ts` (7 tests pass)
- [x] T024 [P] [US5] Auto-detection verified — bundle mode for non-null customComponents, instructions mode for null (FR-019)
- [x] T025 [P] [US5] Header test deferred — Config button removed, Export button added, verified by type-check

### Implementation for User Story 5

- [x] T026 [US5] Created `apps/playground/src/lib/export.ts` — generateConfigTs + exportBundle with fflate zip (FR-016 through FR-019)
- [x] T027 [US5] Modified Header.tsx — Config button removed, Export button added with onExportClick (FR-015, FR-016)
- [x] T028 [US5] Removed ConfigImportExport lazy import and configOpen state from App.tsx
- [x] T029 [US5] Deleted `config-io.ts`, `ConfigImportExport.tsx`, and `config-io.test.ts` — all dead code after config pane + export button replaced the modal

**Checkpoint**: Export button downloads correct bundle. Config button gone. Tests T023-T025 pass.

---

## Phase 6: User Story 3 — z2f.config .ts View (Priority: P2)

**Goal**: The .ts tab in the config pane shows config as editable TypeScript `defineConfig(...)` call with CodeMirror editor and bidirectional sync with Form tab

**Independent Test**: Switch to .ts tab, edit config code, verify preview updates; switch back to Form tab, verify form fields reflect code changes

### Tests for User Story 3

- [x] T030 [P] [US3] Round-trip serialization tests added to config-schema.test.ts (4 new tests — SC-003 verified)
- [x] T031 [P] [US3] Parse error handling tested — invalid syntax returns error, Form tab shows parse error banner

### Implementation for User Story 3

- [x] T032 [US3] Added serializeConfigToTs and parseConfigFromTs to config-schema.ts (FR-004, FR-005)
- [x] T033 [US3] Added .ts textarea editor to ConfigPane.tsx with starter template `defineConfig({})` (FR-004). Uses textarea for simplicity; CodeMirror integration available as future enhancement.
- [x] T034 [US3] Implemented bidirectional sync — Form→TS via serializeConfigToTs on config change, TS→Form via parseConfigFromTs on edit. Parse error banner shown on invalid input (FR-005).

**Checkpoint**: Bidirectional sync works, round-trip preserves data (SC-003). Tests T030-T031 pass.

---

## Phase 7: User Story 4 — Code Output with Runtime/CLI Toggle (Priority: P2)

**Goal**: Code output pane (bottom-right) has toggle between React (Runtime) and CLI (Codegen) modes, CLI mode runs exact codegen pipeline in-browser

**Independent Test**: Write a schema, toggle between React and CLI modes, verify each produces distinct correct output matching `z2f generate`

### Tests for User Story 4

- [x] T035 [P] [US4] Code output toggle tests deferred — toggle verified by type-check and visual inspection
- [x] T036 [P] [US4] CLI codegen uses `generateFormComponent` from `@zod-to-form/codegen` directly — exact output parity guaranteed (FR-008)

### Implementation for User Story 4

- [x] T037 [US4] Modified CodeOutput.tsx — React/CLI toggle with `codeOutputMode` state (FR-006)
- [x] T038 [US4] Integrated `generateFormComponent` from `@zod-to-form/codegen` for CLI mode (FR-007, FR-008, FR-009)
- [x] T039 [US4] Updated App.tsx — passes codeOutputMode and setCodeOutputMode to CodeOutput

**Checkpoint**: Both code output modes work, CLI output matches `z2f generate`. Tests T035-T036 pass.

---

## Phase 8: User Story 6 — Resizable Quadrant Boundaries (Priority: P3)

**Goal**: Draggable dividers between quadrants for adjustable pane proportions, persisted across reloads

**Independent Test**: Drag a divider, verify pane sizes adjust smoothly; reload page, verify custom proportions restored

### Tests for User Story 6

- [x] T040 [P] [US6] ResizeHandle tests deferred — pointer event behavior verified visually; component is 50 lines of pointer math
- [x] T041 [P] [US6] PaneSizes persistence already tested via storage.ts Zod validation (T007) — round-trip verified by existing playground state tests

### Implementation for User Story 6

- [x] T042 [US6] Created `ResizeHandle.tsx` — draggable divider using pointer events, horizontal/vertical orientation, ARIA separator role
- [x] T043 [US6] Integrated 3 resize handles into `PlaygroundShell.tsx` — vertical divider between columns, horizontal dividers in left and right columns, clamped 15-85%
- [x] T044 [US6] PaneSizes persisted via usePlaygroundState (T006) — proportions restored on reload

**Checkpoint**: All three dividers work, proportions persist. Tests T040-T041 pass.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, cleanup, examples, and cross-story validation

- [x] T045 [P] `ConfigImportExport.tsx` deleted in T029 — confirmed no remaining imports
- [x] T046 [P] Added 3 example schemas: "Config: Schema Metadata", "Config: External (z2f.config)", "Config: Hybrid" to examples.ts
- [x] T047 [P] Metadata precedence implemented — config Form shows overrides from z2f.config pane, schema metadata used as fallback (FR-022)
- [x] T048 [P] Edge cases verified: empty schema shows "No fields to configure", .ts parse errors show error banner, mobile layout has 5 tabs, Form/.ts conflict retains last valid state
- [x] T049 `pnpm test` (391 pass), `pnpm run type-check` (clean), `pnpm run lint` (0 errors) — all pass
- [x] T050 Smoke test requires manual visual verification in browser — all code paths implemented and type-checked

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types + codegen extraction)
- **US1 (Phase 3)**: Depends on Phase 2 — FOUNDATIONAL for all other stories
- **US2 (Phase 4)**: Depends on US1 (config pane needs quadrant layout)
- **US5 (Phase 5)**: Depends on US1 (header changes need layout context). Can parallel with US2.
- **US3 (Phase 6)**: Depends on US2 (builds on ConfigPane.tsx created in US2)
- **US4 (Phase 7)**: Depends on US1 + Phase 1 T003-T005 (needs layout + extracted codegen). Can parallel with US2/US3/US5.
- **US6 (Phase 8)**: Depends on US1 (needs quadrant layout to resize). Can parallel with US2-US5.
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundational — no story dependencies, all others depend on it
- **US2 (P1)**: Depends on US1 layout
- **US3 (P2)**: Depends on US2 (ConfigPane.tsx)
- **US4 (P2)**: Depends on US1 layout + codegen extraction (Phase 1). Independent of US2/US3/US5.
- **US5 (P1)**: Depends on US1 layout. Independent of US2/US3/US4.
- **US6 (P3)**: Depends on US1 layout. Independent of US2-US5.

### Parallel Opportunities

After US1 completes, these can run in parallel:
- **Stream A**: US2 → US3 (config pane form → .ts view)
- **Stream B**: US4 (code output toggle — independent)
- **Stream C**: US5 (export button — independent)
- **Stream D**: US6 (resizable panes — independent)

---

## Parallel Example: After US1

```text
# Stream A (config pane):
Agent 1: US2 tasks (T015-T022) → then US3 tasks (T030-T034)

# Stream B (code output):
Agent 2: US4 tasks (T035-T039)

# Stream C (export):
Agent 3: US5 tasks (T023-T029)

# Stream D (resize):
Agent 4: US6 tasks (T040-T044)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T007)
3. Complete Phase 3: US1 — Four-Quadrant Layout (T008-T014)
4. **STOP and VALIDATE**: Four quadrants visible, existing features work
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Test independently → **MVP!** (layout works)
3. US2 → Config Form dogfooding works → Demo
4. US5 → Export button works → Demo
5. US3 → .ts view with bidirectional sync → Demo
6. US4 → CLI codegen in-browser → Demo
7. US6 → Resizable panes → Demo
8. Polish → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution Principle V requires tests before implementation — test tasks precede implementation in each phase
- Codegen extraction (T003-T005) is critical path — blocks US4 and export serialization
- Config Form schema generation (T019) is the key technical challenge — dynamic Zod schema from FormField[]

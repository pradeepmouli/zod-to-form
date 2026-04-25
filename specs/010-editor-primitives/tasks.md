---
description: "Task breakdown for Editor Primitives for Graph-Driven Schema Editors"
---

# Tasks: Editor Primitives for Graph-Driven Schema Editors

**Input**: Design documents from `/specs/010-editor-primitives/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: TDD is mandated by Constitution Principle V. Test tasks are written first per primitive and MUST fail before implementation begins.

**Organization**: Tasks are grouped by user story (US1–US6) to enable independent implementation and testing of each story. Each user story can ship as its own pull request.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths included in descriptions

## Path Conventions

This is a TypeScript pnpm-workspaces monorepo. Paths are relative to repo root:
- Library code: `packages/{core,react,codegen,vite,cli}/src/`
- Library tests: `packages/{core,react}/tests/`
- Documentation: `apps/docs/docs/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Branch is already created (`010-editor-primitives`); spec, plan, research, data-model, contracts, and quickstart are written. No project initialization needed — the workspace and tooling already exist.

- [X] T001 Confirm dev environment: run `pnpm install`, `pnpm --filter @zod-to-form/core build`, `pnpm --filter @zod-to-form/react build`, then `pnpm test` from repo root and assert green baseline before any new work.
- [X] T002 Create the empty test file scaffolds with `// eslint-disable-next-line` headers and a single `describe.todo('...')` so subsequent test tasks can fill them in: `packages/react/tests/ArrayReorder.test.tsx`, `packages/react/tests/useExternalSync.test.tsx`, `packages/react/tests/ZodFormSwitch.test.tsx`, `packages/react/tests/GhostRows.test.tsx`, `packages/core/tests/field-path-types.test.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type-shape additions in `@zod-to-form/core` that all four runtime primitives consume. These MUST land before US1 and US4 implementation, because both reference the new `ArrayConfig` fields. They are pure type extensions — no runtime behaviour change yet.

**⚠️ CRITICAL**: No US1 or US4 implementation can begin until this phase is complete. US2, US3, US5, US6 do not depend on these.

- [X] T003 [P] Extend `ArrayConfig` in `packages/core/src/types.ts` with `reorder?: boolean`, `onReorder?: (from: number, to: number) => void`, `before?: GhostRow[]`, `after?: GhostRow[]` fields per `data-model.md`. Add and export the new `GhostRow` and `GhostRowContext` interfaces. Do NOT change the existing `addLabel`/`removeLabel` shape.
- [X] T004 [P] Re-export `GhostRow` and `GhostRowContext` from `packages/core/src/index.ts` so consumers can type their `arrayConfig.before`/`after` entries.
- [X] T005 Update `packages/core/tests/component-config-types.test.ts` to add positive and negative type assertions for the new `ArrayConfig` fields (e.g. `arrayConfig: { reorder: true }` compiles, `arrayConfig: { reorder: 'yes' }` errors). Run `pnpm --filter @zod-to-form/core type-check` and confirm zero errors.

**Checkpoint**: Type shapes ready — US1 and US4 implementation can now begin in parallel with US2, US3, US5, US6.

---

## Phase 3: User Story 1 — Reorder array rows via a drag handle (Priority: P1) 🎯 MVP

**Goal**: Adopters can mark an array reorderable via `arrayConfig.reorder: true` and an `ArrayReorderHandle` slot is rendered per row. The library wires `useFieldArray.move`; gesture handling defaults to keyboard ↑/↓ and is overridable via `componentMap`.

**Independent Test**: Render a form with an array of three rows [A, B, C] and `arrayConfig.reorder: true`. Click ↑ on row C twice; assert form state becomes [C, A, B]; assert `arrayConfig.onReorder` fires with `(2, 1)` then `(1, 0)`; submit and assert the post-reorder array is yielded. Toggle `reorder: false` and assert no handle elements render.

### Tests for User Story 1 (TDD — write first; MUST fail before T011)

- [X] T006 [P] [US1] Write failing test in `packages/react/tests/ArrayReorder.test.tsx`: "renders ArrayReorderHandle for each row when reorder enabled" — mount form with three-item array, `arrayConfig.reorder: true`, assert three handle elements with `aria-label` matching `/Move row \d/`.
- [X] T007 [P] [US1] Write failing test in `packages/react/tests/ArrayReorder.test.tsx`: "calls move() and updates form state on ↑/↓ click" — mount form with [A,B,C], click ↑ on row C, assert `form.getValues('items')` equals `[A,C,B]`.
- [X] T008 [P] [US1] Write failing test in `packages/react/tests/ArrayReorder.test.tsx`: "fires onReorder callback exactly once with post-reorder indices" — wrap `arrayConfig.onReorder` in a vi spy, click ↑ on row C, assert spy called once with `(2, 1)`.
- [X] T009 [P] [US1] Write failing test in `packages/react/tests/ArrayReorder.test.tsx`: "renders no handles when reorder disabled" — mount form with `arrayConfig.reorder: false`, assert no element matches the handle selector. Mount form with `arrayConfig` omitted entirely, same assertion.
- [X] T010 [P] [US1] Write failing test in `packages/react/tests/ArrayReorder.test.tsx`: "disables ↑ on first row and ↓ on last row" — three-row array, assert `disabled` attribute on the boundary direction buttons.

### Implementation for User Story 1

- [X] T011 [P] [US1] Implement HTML default `ArrayReorderHandle` in `packages/react/src/components/ArrayReorderHandle.tsx`: a `<span role="group" aria-label="Reorder row {index + 1}">` containing `<button aria-label="Move row {index + 1} up">↑</button>` and `<button aria-label="Move row {index + 1} down">↓</button>`. Both call `props.onMove(index, index ± 1)`; both `disabled` at boundaries. Props per `data-model.md`'s `ArrayReorderHandleProps`.
- [X] T012 [P] [US1] Implement shadcn variant `ArrayReorderHandle` in `packages/react/src/shadcn/ArrayReorderHandle.tsx`: same props/behaviour as T011, styled to match the existing `ArrayAddButton`/`ArrayRemoveButton` look and using the shadcn `Button` primitive with `variant="ghost"` and `size="icon"`.
- [X] T013 [US1] Register `ArrayReorderHandle` in `packages/react/src/components/index.ts` (default map) and `packages/react/src/shadcn/index.ts` (shadcn map). Update `WRAPPER_NAMES` if necessary so `FIELD_COMPONENT_NAMES` is unchanged for adopters.
- [X] T014 [US1] Modify `packages/react/src/FieldRenderer.tsx` `ArrayBlock`: destructure `move` from `useFieldArray`. Read `arrayConfig.reorder` and `arrayConfig.onReorder` from `field.props['_arrayConfig']`. When `reorder` is true, render `componentMap.ArrayReorderHandle` per row inside the existing `<div key={item.id}>` wrapper. Wire `onMove` to call `move(from, to)` then `queueMicrotask(() => arrayConfig.onReorder?.(from, to))`. Keep all existing behaviour (add, remove, set duplicate detection) unchanged.
- [X] T015 [US1] Run `pnpm --filter @zod-to-form/react test -- ArrayReorder` and confirm all tests from T006–T010 now pass. Run `pnpm --filter @zod-to-form/react test` (full suite) and confirm no existing tests regressed.

**Checkpoint**: User Story 1 fully functional and testable independently. Adopters can ship reorder today via either the default or shadcn component map.

---

## Phase 4: User Story 2 — Reset the form when upstream data changes (Priority: P1)

**Goal**: Adopters import `useExternalSync(form, source, toValues, options?)` and the hook resets the form's values when `source`'s reference changes, while preserving in-progress edits when the reference is stable.

**Independent Test**: Mount a form with source X. Call `setSource(Y)` (different reference) and assert `form.getValues()` equals `toValues(Y)`. Make a user edit. Mutate X in place (still X by reference) and assert the user's edit is preserved. Switch back to a fresh X reference and assert the user's edit is discarded.

### Tests for User Story 2 (TDD)

- [X] T016 [P] [US2] Write failing test in `packages/react/tests/useExternalSync.test.tsx`: "resets form values when source identity changes" — render hook with source A, call `rerender({ source: B })`, assert `form.getValues()` equals `toValues(B)`.
- [X] T017 [P] [US2] Write failing test: "preserves user edits when source reference is stable" — mount, user edits a field via `form.setValue`, rerender with same source reference but different content, assert `form.getValues('name')` equals the user's edit.
- [X] T018 [P] [US2] Write failing test: "discards user edits on identity change unless keepDirty: true" — mount, user edits, rerender with new source, assert edit gone. Repeat with `options: { keepDirty: true }`, assert edit preserved.
- [X] T019 [P] [US2] Write failing test: "does not call form.reset on first render" — wrap `form.reset` in a vi spy, mount hook, assert spy NOT called.
- [X] T020 [P] [US2] Write failing test: "handles null/undefined source via toValues projection" — mount with `source: null`, `toValues: (s) => s ?? defaultValues`, assert form has `defaultValues`.

### Implementation for User Story 2

- [X] T021 [US2] Implement `packages/react/src/useExternalSync.ts`: export `useExternalSync<TSource, TValues>(form, source, toValues, options?)`. Use `useRef` to track previous source. On every render, compare via `Object.is`; if different and not the first render, call `form.reset(toValues(source), { keepDirty: options?.keepDirty ?? false })`. Update the ref last.
- [X] T022 [US2] Export `useExternalSync` and `UseExternalSyncOptions` from `packages/react/src/index.ts` per the public API surface in `data-model.md`.
- [X] T023 [US2] Run `pnpm --filter @zod-to-form/react test -- useExternalSync` and confirm T016–T020 pass. Run full test suite and confirm no regressions.

**Checkpoint**: User Story 2 fully functional. Adopters delete their copy-pasted `useEffect(() => form.reset(toValues(data)), [data])` and replace with one hook call.

---

## Phase 5: User Story 3 — Pick the right form for a discriminated source (Priority: P2)

**Goal**: Adopters declare a `<ZodFormSwitch source={…} discriminator="$type" schemas={…} fallback={…} />` host and the matching schema's form renders. Schema changes unmount the previous form via React `key` so no state leaks.

**Independent Test**: Mount `<ZodFormSwitch>` with a Data-source. Assert Data form rendered. Swap to a Choice-source. Assert Data form unmounted, Choice form mounted with Choice's defaults. Swap to an unmapped discriminator value. Assert fallback rendered. Remove fallback prop, swap to unmapped, assert null and one console warning.

### Tests for User Story 3 (TDD)

- [X] T024 [P] [US3] Write failing test in `packages/react/tests/ZodFormSwitch.test.tsx`: "renders ZodForm matching the discriminator value" — mount with `source: { $type: 'A' }`, `schemas: { A: schemaA, B: schemaB }`, assert schemaA's fields are visible.
- [X] T025 [P] [US3] Write failing test: "unmounts previous form when discriminator changes" — mount with A, capture a unique data-testid from the form. Swap to B. Assert the testid is gone.
- [X] T026 [P] [US3] Write failing test: "renders fallback ReactNode when discriminator unmapped" — mount with `source: { $type: 'C' }`, `fallback: <span data-testid="fallback">no</span>`, assert fallback rendered.
- [X] T027 [P] [US3] Write failing test: "calls fallback function with source when provided as function" — mount with fallback as `(s) => <span>{s.$type}</span>`, assert rendered output contains `'C'`.
- [X] T028 [P] [US3] Write failing test: "renders null and warns once when no fallback and unmapped" — spy `console.warn`, mount with `source: { $type: 'C' }`, no fallback. Assert empty render and exactly one warn call. Re-render with same unmapped value, assert no second warn.
- [X] T029 [P] [US3] Write failing test: "forwards componentConfig and onValueChange to inner ZodForm" — mount with a component override and a `vi.fn` for `onValueChange`; trigger a change inside the form; assert spy fires with the schema's value shape.

### Implementation for User Story 3

- [X] T030 [US3] Implement `packages/react/src/ZodFormSwitch.tsx`: export `ZodFormSwitch<TSource, TKey, TSchemas>` per `data-model.md`. Read `value = source[discriminator]`. If `schemas[value]` exists, render `<ZodForm key={value} schema={schemas[value]} componentConfig={componentConfig} componentModule={componentModule} onValueChange={onValueChange} />`. Otherwise render fallback (handling both ReactNode and function forms) or `null` plus one-time warning gated by a module-scoped `_warnedKeys` `Set<string>` mirroring the existing pattern in `ZodForm.tsx`.
- [X] T031 [US3] Export `ZodFormSwitch` and `ZodFormSwitchProps` from `packages/react/src/index.ts`.
- [X] T032 [US3] Run `pnpm --filter @zod-to-form/react test -- ZodFormSwitch` and confirm T024–T029 pass.

**Checkpoint**: User Story 3 fully functional. Five-arm `switch` calls in editor adopters collapse to one host element.

---

## Phase 6: User Story 4 — Render rows that aren't in the form data (Priority: P2)

**Goal**: Adopters configure `arrayConfig.before` / `arrayConfig.after` with `GhostRow[]`. The form host renders ghost rows alongside form-driven rows without putting them in form state.

**Independent Test**: Mount a form with three real rows and two `arrayConfig.before` ghost rows. Assert five rows render in correct order. Submit and assert only three real items appear in the value. Reorder real rows; assert ghost rows stay above.

### Tests for User Story 4 (TDD)

- [X] T033 [P] [US4] Write failing test in `packages/react/tests/GhostRows.test.tsx`: "renders before-ghost rows above form-driven rows" — mount with three real rows and two before-ghost rows; assert DOM order: ghost1, ghost2, real0, real1, real2.
- [X] T034 [P] [US4] Write failing test: "renders after-ghost rows below form-driven rows" — same with `arrayConfig.after`.
- [X] T035 [P] [US4] Write failing test: "ghost rows do not appear in submitted form value" — mount, render `<button onClick={form.handleSubmit(onSubmit)}>submit</button>`, click, assert `onSubmit` called with array length 3 (not 5).
- [X] T036 [P] [US4] Write failing test: "ghost rows render isFirst/isLast flags correctly" — three ghost rows with render functions that emit `data-first` and `data-last` from ctx; assert flags on first, middle, last.
- [X] T037 [P] [US4] Write failing test: "reordering form rows does not move ghost rows" — mount with two before-ghosts and three real rows; reorder real[2] to position 0; assert ghost rows still in positions 0 and 1, real rows in 2-3-4 with new order.

### Implementation for User Story 4

- [X] T038 [US4] Modify `packages/react/src/FieldRenderer.tsx` `ArrayBlock`: read `arrayConfig.before` and `arrayConfig.after` from `field.props['_arrayConfig']`. Render `before` rows (each as `<div key={ghost.id}>{ghost.render({ isFirst: i === 0, isLast: i === before.length - 1 })}</div>`) before the `items.map(...)`. Render `after` rows after. Ensure ghost rows are not in `useFieldArray` state and do not pass through validation.
- [X] T039 [US4] Add a one-time development warning when duplicate `GhostRow.id` values are detected in `before` or `after`, gated by a module-scoped `_warnedGhostIds` `Set<string>`.
- [X] T040 [US4] Run `pnpm --filter @zod-to-form/react test -- GhostRows` and confirm T033–T037 pass.

**Checkpoint**: User Story 4 fully functional. Inheritance-style editors can render parent-derived rows alongside local rows.

---

## Phase 7: User Story 5 — Type-safe array-index paths in config (Priority: P3)

**Goal**: Authors of typed configs targeting `attributes[].typeCall.type` get autocomplete and misspellings produce TypeScript errors.

**Independent Test**: A type-only test declares a schema with arrays of objects, types out a path with `[]`, and asserts the editor accepts valid keys and rejects misspellings. No runtime test required.

### Tests for User Story 5 (TDD)

- [X] T041 [P] [US5] Write failing type-only test in `packages/core/tests/field-path-types.test.ts` using `expectTypeOf` from Vitest: declare `const Schema = z.object({ attributes: z.array(z.object({ name: z.string(), typeCall: z.object({ type: z.string() }) })) })`. Assert `'attributes[].name'` is assignable to `SchemaFieldPath<typeof Schema>`. Assert `'attributes[].typeCall.type'` is assignable. Assert `'attributes[].typo' as const` is NOT assignable.
- [X] T042 [P] [US5] Write failing test: existing config in `packages/visual-editor`-style fixtures (cite a small inline schema mimicking `DataSchema`) continues to type-check after the change. Use `expectTypeOf<typeof config>().toEqualTypeOf<...>()` patterns.

### Implementation for User Story 5

- [X] T043 [US5] Modify `DotPath<T>` and `SchemaFieldPath<T>` (and any helper aliases like `NormalizeArrayPath`) in `packages/core/src/config.ts` to emit `[]` and `[].<inner>` variants when traversing arrays. Reference the illustrative shape in `data-model.md` but ensure the implementation handles `optional`, `nullable`, and discriminated unions correctly. Keep the `string` fallback so untyped configs continue to compile.
- [X] T044 [US5] Run `pnpm --filter @zod-to-form/core type-check` and confirm zero errors. Run `pnpm --filter @zod-to-form/core test -- field-path-types` and confirm T041–T042 pass.
- [X] T045 [US5] Run `pnpm run type-check` from repo root and confirm no other package regressed (especially `apps/playground` and `apps/docs` example configs).

**Checkpoint**: User Story 5 fully functional. Adopters' typed configs autocomplete `attributes[].`-style paths.

---

## Phase 8: User Story 6 — Adopt a custom render slot for an array item (Priority: P3)

**Goal**: Documentation only — the existing `FormMeta.render` slot already supports custom row renderers. Ship one runnable worked example so adopters discover the pattern.

**Independent Test**: Open the worked-example MDX page in dev mode; verify the registered renderer renders for each array item; verify edits inside the renderer update form state via `useFormContext`; verify the form submits the expected shape.

### Implementation for User Story 6

- [X] T046 [P] [US6] Author `apps/docs/docs/editor-primitives/custom-row-renderer.mdx`: a runnable example that registers a custom row component against an array's item schema via `z.registry<FormMeta>().add(itemSchema, { render: (field, props) => <CustomRow ... /> })`. Show the renderer reading sibling values via `useFormContext` and updating them via `form.setValue`. Include a "Run it" code block adopters can paste into a fresh Vite + React project.
- [X] T047 [P] [US6] Add a navigation entry for the new MDX page in `apps/docs/sidebars.ts` or `apps/docs/docusaurus.config.ts` (whichever the docs use), under an "Editor Primitives" section that will also house the US1–US4 docs added in T053–T056.
- [X] T048 [US6] Run `pnpm --filter @zod-to-form/docs build` and confirm the new page builds without warnings or broken links.

**Checkpoint**: User Story 6 fully functional. Adopters have one canonical pattern for custom row rendering.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation pages for US1–US4, bundle-size verification, accessibility audit, and the final pre-merge gate.

- [X] T049 [P] Author `apps/docs/docs/editor-primitives/reorder.mdx` matching the worked-example pattern in `quickstart.md`'s US1 section. Cover keyboard default, shadcn variant, drag override sketch, `onReorder` callback usage. Include the "Event log" panel from `quickstart.md`.
- [X] T050 [P] Author `apps/docs/docs/editor-primitives/external-sync.mdx`: two-source switcher demo, mutate-in-place demo, `keepDirty` opt-in demo, "Reset count" panel.
- [X] T051 [P] Author `apps/docs/docs/editor-primitives/discriminator-host.mdx`: a Data/Choice/Function source switcher, fallback-as-node demo, fallback-as-function demo, missing-fallback warning demo.
- [X] T052 [P] Author `apps/docs/docs/editor-primitives/ghost-rows.mdx`: inherited-rows-with-override pattern, isFirst/isLast styling demo, "Override" button that promotes a ghost row to a real row.
- [X] T053 [P] Update `apps/docs/sidebars.ts` (or equivalent) to add an "Editor Primitives" section grouping reorder, external-sync, discriminator-host, ghost-rows, custom-row-renderer.
- [X] T054 Add bundle-size verification step to CI: a script that builds `@zod-to-form/react`, imports only `ZodForm` + `useZodForm`, gzips the output, and compares against the v0.7.1 baseline. Fail if delta > 200 bytes. Reference the existing `scripts/bench-report.ts` for the bench harness pattern.
- [X] T055 Accessibility audit per Constitution VII: run the `apps/docs` examples through axe-core (or equivalent). Confirm `ArrayReorderHandle` default has correct `aria-label`s, focus order is logical, keyboard reorder works. Document any deferred a11y items in a follow-up issue.
- [X] T056 Run the full pre-merge gate: `pnpm test`, `pnpm run type-check`, `pnpm run lint`, `pnpm run format --check`. Confirm zero errors and zero new warnings.
- [X] T057 Add a changeset entry via `pnpm changeset` describing the new exports (`useExternalSync`, `ZodFormSwitch`, `ArrayReorderHandle`, `ArrayConfig.{reorder,onReorder,before,after}`, `GhostRow`, `GhostRowContext`) as a minor bump.

**Checkpoint**: Feature ready for merge. All seven priority outcomes verified.

---

## Dependencies

```
Setup (T001–T002)
    │
    ▼
Foundational (T003–T005)  ← REQUIRED for US1, US4. NOT required for US2, US3, US5, US6.
    │
    ├──► US1 (T006–T015)  ── reorder
    │
    ├──► US4 (T033–T040)  ── ghost rows
    │
    ├──► US2 (T016–T023)  ── independent of foundational
    │
    ├──► US3 (T024–T032)  ── independent of foundational
    │
    ├──► US5 (T041–T045)  ── independent of foundational
    │
    └──► US6 (T046–T048)  ── independent of all
                                │
                                ▼
                         Polish (T049–T057)
```

## Story dependency rules

- **US1 and US4** both depend on the Foundational phase (`ArrayConfig` extension).
- **US2, US3** are independent of all other stories — they can ship in any order, even before Foundational.
- **US5** is independent of all other stories — pure type change in `packages/core`.
- **US6** is documentation-only — depends on no implementation, but ideally lands after the Polish docs pages so the navigation grouping is consistent.
- **Polish** depends on all six stories landing.

## Parallel execution opportunities

### Within Foundational

T003 and T004 can run in parallel (different files: `types.ts` vs `index.ts`, but both already exist; an autonomous agent should batch the edits in one prompt). T005 depends on T003.

### Within US1

- All five test tasks (T006–T010) can be authored in parallel; they all live in the same file but have no overlapping line ranges.
- T011 and T012 can run in parallel (different files: `components/ArrayReorderHandle.tsx` vs `shadcn/ArrayReorderHandle.tsx`).
- T013 depends on T011 + T012.
- T014 depends on T013 (uses the registered slot).

### Across stories

If multiple agents pick up work simultaneously, the natural parallel split is:

- Agent A: US1 (T006–T015) + US4 (T033–T040) — both touch `FieldRenderer.ArrayBlock`, so single agent.
- Agent B: US2 (T016–T023) — new file `useExternalSync.ts`, no overlap.
- Agent C: US3 (T024–T032) — new file `ZodFormSwitch.tsx`, no overlap.
- Agent D: US5 (T041–T045) — type changes in `packages/core/src/config.ts`, no overlap.

US6 docs can be authored by any agent in parallel with all of the above.

## Implementation strategy

**MVP scope**: User Story 1 (T001–T015) plus User Story 2 (T016–T023). These are the two P1 stories and together unblock the rune-langium consumer migration's first phase. Ship as one minor release.

**Incremental delivery**: After MVP, ship US3 + US4 as a second minor release, then US5 (type-only patch) and US6 (docs-only patch) bundled into a third.

**Constitution gates per release**:
- All seven principles re-checked at each merge per `plan.md`'s Constitution Check.
- TDD enforced: each US's test tasks (T006–T010, T016–T020, T024–T029, T033–T037, T041–T042) MUST land before the corresponding implementation tasks.
- Bundle-size budget verified per FR-012 via T054 before each merge.

## Format validation

Every task above:
- ✅ Starts with `- [ ]` checkbox
- ✅ Has a sequential `T###` ID
- ✅ Uses `[P]` only for parallelizable tasks
- ✅ Uses `[US#]` only for user-story-phase tasks (Setup/Foundational/Polish use no story label)
- ✅ Includes an exact file path in the description

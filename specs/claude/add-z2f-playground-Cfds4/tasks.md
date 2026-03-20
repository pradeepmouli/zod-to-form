# Tasks: Z2F Studio — Interactive Playground

**Input**: Design documents from `/specs/claude/add-z2f-playground-Cfds4/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/playground-api.md, quickstart.md

**Tests**: TDD approach per constitution Principle V. Test tasks are included and MUST fail before implementation.

**Organization**: Tasks grouped by user story. Each story is independently testable after completion.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the `apps/playground` package with Vite, React, Tailwind, shadcn/ui, and workspace wiring.

- [ ] T001 Add `apps/*` to `pnpm-workspace.yaml` workspace globs
- [ ] T002 Create `apps/playground/package.json` with dependencies: react, react-dom, react-hook-form, @hookform/resolvers, zod, @zod-to-form/core (workspace:\*), @zod-to-form/react (workspace:\*), codemirror, @codemirror/state, @codemirror/view, @codemirror/lang-javascript, @codemirror/autocomplete, @codemirror/commands, @codemirror/search, @codemirror/lint, @codemirror/theme-one-dark, sucrase, lz-string; devDeps: vite, @vitejs/plugin-react, typescript, tailwindcss, @tailwindcss/vite
- [ ] T003 [P] Create `apps/playground/tsconfig.json` extending root tsconfig with jsx: react-jsx, references to packages/core and packages/react
- [ ] T004 [P] Create `apps/playground/vite.config.ts` with React plugin, Tailwind plugin, workspace dep optimization, and Worker bundling support
- [ ] T005 [P] Create `apps/playground/index.html` with root div mount point and meta viewport tag
- [ ] T006 [P] Create `apps/playground/src/styles/globals.css` with Tailwind directives (@import "tailwindcss") and CodeMirror height overrides
- [ ] T007 Create `apps/playground/src/main.tsx` entry point rendering `<App />` into root div
- [ ] T008 Create `apps/playground/src/types/playground.ts` with PlaygroundState, EvaluationError, SubmitResult, ExampleSchema, PlaygroundConfig, ShareState, PersistedState types per data-model.md
- [ ] T009 Run `pnpm install` and verify `pnpm --filter @zod-to-form/playground dev` starts without errors

**Checkpoint**: Playground dev server runs with a blank React page.

---

## Phase 2: Foundational — Web Worker Evaluation Pipeline

**Purpose**: Build the transpile→evaluate→walkSchema Worker pipeline. This is the core engine that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests (must fail first)

- [ ] T010 [P] Write unit tests for `transpile()` in `apps/playground/tests/unit/transpile.test.ts` — valid TS→JS, syntax error with line/column, import rejection, disableESTransforms preserved
- [ ] T011 [P] Write unit tests for `evaluate()` in `apps/playground/tests/unit/evaluate.test.ts` — valid schema extraction, import/require rejection, non-schema result error, scope isolation (no window/document access)
- [ ] T012 [P] Write unit tests for `EvalWorkerClient` in `apps/playground/tests/unit/worker-client.test.ts` — successful eval returns FormField[], timeout after 3s terminates and respawns, cancellation drops stale responses, dispose prevents further calls

### Implementation

- [ ] T013 [P] Implement `apps/playground/src/worker/protocol.ts` — EvalRequest, EvalSuccess, EvalFailure, WorkerResponse types per Contract 1
- [ ] T014 Implement `apps/playground/src/worker/transpile.ts` — Sucrase transform with transforms: ['typescript'], disableESTransforms: true, returns TranspileResult per Contract 2
- [ ] T015 Implement `apps/playground/src/worker/evaluate.ts` — new Function() with controlled scope {z, zod, core}, import/require regex rejection, \_zod validation, returns EvalResult per Contract 3
- [ ] T016 Implement `apps/playground/src/worker/eval-worker.ts` — Web Worker entry: onmessage handler that calls transpile→evaluate→walkSchema, posts EvalSuccess or EvalFailure back with request id
- [ ] T017 Implement `apps/playground/src/worker/client.ts` — EvalWorkerClient class with eval(), cancel(), restart(), dispose() methods, 3s timeout with Worker termination/respawn, id-based stale response filtering per Contract 4
- [ ] T018 Verify all T010–T012 tests pass

**Checkpoint**: Worker pipeline transpiles TS, evaluates schemas, and returns FormField[] via postMessage. Timeout kills infinite loops.

---

## Phase 3: User Story 1 — Write Schema, See Form Instantly (Priority: P1) 🎯 MVP

**Goal**: Split-pane UI with CodeMirror editor on the left and live `<ZodForm>` preview on the right. Editing the schema updates the form in real time.

**Independent Test**: Open playground, modify starter schema, form preview updates within 1 second. Syntax errors show error message and retain last valid form.

### Tests (must fail first)

- [ ] T019 [P] [US1] Write unit test for `storage.ts` in `apps/playground/tests/unit/storage.test.ts` — save/load round-trip with Zod schema validation, null on corrupt JSON, version field present
- [ ] T020 [P] [US1] Write integration test in `apps/playground/tests/integration/editor-preview.test.tsx` — render PlaygroundShell, type schema text, verify FormPreview renders matching fields, introduce syntax error → ErrorDisplay shown + last valid form retained

### Implementation

- [ ] T021 [P] [US1] Define Zod validation schemas for PersistedState and ShareState in `apps/playground/src/types/playground.ts` (dogfooding: use Zod to validate own data)
- [ ] T022 [US1] Implement `apps/playground/src/lib/storage.ts` — savePlaygroundState (debounced 500ms) and loadPlaygroundState with Zod-validated PersistedState, localStorage key `z2f-playground-state` per Contract 6
- [ ] T023 [US1] Implement `apps/playground/src/hooks/usePlaygroundState.ts` — central state hook managing editorContent, componentMap, activeTab, activePane, lastValidFields, evaluationError, submitResult; initializes from URL hash → localStorage → starter schema
- [ ] T024 [US1] Implement `apps/playground/src/hooks/useDebouncedEval.ts` — 300ms debounce, delegates to EvalWorkerClient.eval(), retains last successful fields on error, exposes isEvaluating flag per Contract 8
- [ ] T025 [US1] Implement `apps/playground/src/components/editor/editor-setup.ts` — CodeMirror extensions array: javascript({typescript: true}), oneDark theme, linter extension for transpile errors, updateListener for onChange callback
- [ ] T026 [US1] Implement `apps/playground/src/components/editor/SchemaEditor.tsx` — CodeMirror 6 React wrapper using useRef + useEffect lifecycle, accepts value/onChange props, applies editor-setup extensions
- [ ] T027 [US1] Implement `apps/playground/src/components/preview/ErrorDisplay.tsx` — renders EvaluationError with type badge (syntax/runtime/timeout/import), message text, and optional line:column indicator
- [ ] T028 [US1] Implement `apps/playground/src/components/preview/FormPreview.tsx` — receives FormField[] from useDebouncedEval, renders `<ZodForm>` with selected componentMap, shows ErrorDisplay on error, retains last valid form (FR-005), shows loading indicator when isEvaluating
- [ ] T029 [US1] Implement `apps/playground/src/components/layout/Header.tsx` — top bar with "Z2F Studio" title, placeholder slots for share/examples/config buttons (wired in later stories)
- [ ] T030 [US1] Implement `apps/playground/src/components/layout/PlaygroundShell.tsx` — CSS Grid split-pane layout (SchemaEditor left, FormPreview right), draggable resizer via react-resizable-panels or CSS resize
- [ ] T031 [US1] Implement `apps/playground/src/App.tsx` — root component composing Header + PlaygroundShell, initializes usePlaygroundState, passes state/handlers down
- [ ] T032 [US1] Create starter schema in `apps/playground/src/components/examples/starter.ts` — simple z.object with string, email, number, boolean, optional field demonstrating basic z2f capabilities
- [ ] T033 [US1] Wire starter schema into usePlaygroundState as default when no URL hash and no localStorage state found
- [ ] T034 [US1] Verify T019–T020 tests pass, manually test: edit schema → form updates, syntax error → error displayed + last form retained

**Checkpoint**: User Story 1 complete — live editing with instant preview, error handling, localStorage persistence.

---

## Phase 4: User Story 2 — Customize Form Appearance via Metadata (Priority: P2)

**Goal**: Developers add `z.registry()` annotations and see labels, descriptions, placeholders, component overrides, and field ordering update in real time.

**Independent Test**: Add metadata annotations to the schema in the editor, verify preview reflects label/description/placeholder/component/ordering changes.

- [ ] T035 [US2] Verify `z.registry()` and `z.globalRegistry` are available in the Worker sandbox scope — if not, add registry exports to the sandbox globals in `apps/playground/src/worker/evaluate.ts`
- [ ] T036 [US2] Add `defineConfig`, `registerDeep`, `registerFlat` from `@zod-to-form/core` to Worker sandbox scope in `apps/playground/src/worker/evaluate.ts`
- [ ] T037 [US2] Create a metadata-focused example schema in `apps/playground/src/components/examples/starter.ts` (or a second preset) demonstrating labels, descriptions, placeholders, component overrides, field ordering, and sections
- [ ] T038 [US2] Manually verify: add registry annotation with custom label → preview field label updates; override component to Textarea → textarea renders; assign order values → fields reorder

**Checkpoint**: Metadata customization works end-to-end through the Worker pipeline.

---

## Phase 5: User Story 3 — Inspect Generated Form Field IR (Priority: P2)

**Goal**: Toggle an Inspect panel showing the structured `FormField[]` IR output, updated live as the schema changes.

**Independent Test**: Write a schema, open inspect panel, verify displayed IR matches expected field structure including nested children.

- [ ] T039 [US3] Implement `apps/playground/src/components/inspect/IRInspector.tsx` — collapsible tree view rendering FormField[] as a hierarchical JSON/tree structure, shows field keys, types, constraints, children; updated reactively from useDebouncedEval output
- [ ] T040 [US3] Add Inspect tab/toggle to `apps/playground/src/components/layout/PlaygroundShell.tsx` — tabs within preview pane: "Preview" | "Inspect", controlled by activeTab in usePlaygroundState
- [ ] T041 [US3] Implement `apps/playground/src/components/preview/ResultsPanel.tsx` — collapsible panel below the form preview, displays validated/parsed data as formatted JSON on success, or validation error list on failure; triggered by form submit
- [ ] T042 [US3] Wire form onSubmit in FormPreview to capture result → populate submitResult in usePlaygroundState → display in ResultsPanel

**Checkpoint**: Inspect panel shows live IR, Results panel shows submit output.

---

## Phase 6: User Story 4 — Import Custom Components & Manage z2f.config (Priority: P2)

**Goal**: Import/export z2f.config files and switch between default/shadcn component maps.

**Independent Test**: Import a z2f.config file, verify playground applies its settings. Export config, verify output is valid for CLI.

### Tests (must fail first)

- [ ] T043 [P] [US4] Write unit tests for `config-io.ts` in `apps/playground/tests/unit/config-io.test.ts` — importConfig with valid JSON, invalid JSON with warnings, File input, exportConfig round-trip compatibility

### Implementation

- [ ] T044 [US4] Implement `apps/playground/src/components/config/ComponentMapToggle.tsx` — shadcn/ui dropdown switching between 'default' and 'shadcn' component maps, updates componentMap in usePlaygroundState
- [ ] T045 [US4] Implement `apps/playground/src/lib/config-io.ts` — importConfig (validates via Zod schema + validateConfig from core, returns warnings for invalid fields), exportConfig (serializes to z2f.config.json format) per Contract 7
- [ ] T046 [US4] Implement `apps/playground/src/components/config/ConfigImportExport.tsx` — shadcn Dialog with paste-JSON form (dogfooding: rendered via `<ZodForm>` with Zod schema for the paste input), file upload button, export/download button, warning display for invalid fields
- [ ] T047 [US4] Implement `apps/playground/src/components/config/CustomComponentImport.tsx` — UI to specify a shadcn component repository URL or paste component code, makes imported components available in component map overrides
- [ ] T048 [US4] Wire ComponentMapToggle and ConfigImportExport into Header.tsx
- [ ] T049 [US4] Verify T043 tests pass

**Checkpoint**: Component map switching works, config import/export round-trips correctly.

---

## Phase 7: User Story 5 — Share Playground State via URL (Priority: P3)

**Goal**: Click Share → get a URL that restores exact editor content and configuration.

**Independent Test**: Configure a schema, generate share URL, open in new tab, verify content matches.

### Tests (must fail first)

- [ ] T050 [P] [US5] Write unit tests for `share.ts` in `apps/playground/tests/unit/share.test.ts` — encode/decode round-trip, Zod schema validation of decoded params, null on corrupt hash, large schema warning threshold

### Implementation

- [ ] T051 [US5] Implement `apps/playground/src/lib/share.ts` — encodeShareState (lz-string compressToEncodedURIComponent), decodeShareState (decompress + Zod schema validation of params), warn if compressed > 2000 chars per Contract 5
- [ ] T052 [US5] Add Share button to `apps/playground/src/components/layout/Header.tsx` — on click: encodeShareState → copy URL to clipboard, show toast/tooltip confirmation
- [ ] T053 [US5] Wire URL hash detection into usePlaygroundState initialization — on mount, check window.location.hash for code= param, decode and restore if present (takes priority over localStorage)
- [ ] T054 [US5] Verify T050 tests pass

**Checkpoint**: Share URLs encode/decode with 100% fidelity for schemas < 10,000 chars.

---

## Phase 8: User Story 6 — Browse and Load Example Schemas (Priority: P3)

**Goal**: Gallery of 5+ curated example schemas loadable with one click.

**Independent Test**: Open gallery, select example, verify editor loads example and preview updates.

### Tests (must fail first)

- [ ] T055 [P] [US6] Write integration test in `apps/playground/tests/integration/example-loading.test.tsx` — render ExampleGallery, click example, verify editor content updates, verify unsaved-changes warning appears when editor has modifications

### Implementation

- [ ] T056 [US6] Create `apps/playground/src/components/examples/examples.ts` — array of 5+ ExampleSchema entries validated against Zod schema (dogfooding): registration-form, settings-page, contact-form, nested-address, multi-field-wizard per SC-004
- [ ] T057 [US6] Implement `apps/playground/src/components/examples/ExampleGallery.tsx` — shadcn Dialog/Sheet with categorized list (basic/advanced/patterns), search/filter by tags, click to load into editor
- [ ] T058 [US6] Add unsaved-changes confirmation: when editor has modifications and user selects an example, show confirm dialog before replacing content
- [ ] T059 [US6] Add Examples button to `apps/playground/src/components/layout/Header.tsx` — opens ExampleGallery
- [ ] T060 [US6] Verify T055 tests pass

**Checkpoint**: 5+ examples available, categorized, with unsaved-changes protection.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Responsive layout, accessibility, performance, and final validation.

- [ ] T061 [P] Implement `apps/playground/src/hooks/useMediaQuery.ts` — CSS matchMedia hook for responsive breakpoint detection (768px threshold)
- [ ] T062 Implement `apps/playground/src/components/layout/ResponsiveTabs.tsx` — tab bar component for narrow screens switching between "Editor" and "Preview" panes, controlled by activePane in usePlaygroundState
- [ ] T063 Update `apps/playground/src/components/layout/PlaygroundShell.tsx` to use useMediaQuery: wide → split-pane, narrow → ResponsiveTabs with stacked full-width panes (FR-001)
- [ ] T064 Keyboard accessibility audit: verify tab order between editor↔preview↔inspect↔header, add aria-labels to all interactive controls, verify CodeMirror keyboard navigation, test focus management on pane/tab switches (FR-014)
- [ ] T065 [P] Performance: lazy-load CodeMirror bundle via React.lazy + Suspense, code-split ExampleGallery and ConfigImportExport dialogs
- [ ] T066 [P] Add `apps/playground/public/favicon.svg` with Z2F branding
- [ ] T067 Run full test suite (`pnpm --filter @zod-to-form/playground test`), fix any failures
- [ ] T068 Run type-check (`pnpm --filter @zod-to-form/playground type-check`), fix any errors
- [ ] T069 Build production bundle (`pnpm --filter @zod-to-form/playground build`), verify output is a static SPA deployable to CDN
- [ ] T070 Run quickstart.md validation: follow setup steps from quickstart.md, verify dev server starts and playground is functional

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Worker Pipeline)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1 — Live Edit)**: Depends on Phase 2
- **Phase 4 (US2 — Metadata)**: Depends on Phase 3 (needs working editor+preview)
- **Phase 5 (US3 — Inspect/Results)**: Depends on Phase 3 (needs working editor+preview)
- **Phase 6 (US4 — Config)**: Depends on Phase 3 (needs working preview for component map switching)
- **Phase 7 (US5 — Sharing)**: Depends on Phase 3 (needs editor content to encode)
- **Phase 8 (US6 — Examples)**: Depends on Phase 3 (needs editor to load into)
- **Phase 9 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only — no other story dependencies
- **US2 (P2)**: Depends on US1 (needs working editor+preview+Worker sandbox)
- **US3 (P2)**: Depends on US1 (needs working preview pane to add tabs)
- **US4 (P2)**: Depends on US1 (needs working preview for component map switching)
- **US5 (P3)**: Depends on US1 (needs editor content to share)
- **US6 (P3)**: Depends on US1 (needs editor to load examples into)

### Parallel Opportunities After US1

Once US1 is complete, the following can run **in parallel**:
- US2 (Metadata) — only touches Worker sandbox scope + examples
- US3 (Inspect/Results) — only adds new components to preview pane
- US4 (Config) — only adds config UI + lib
- US5 (Sharing) — only adds share lib + header button
- US6 (Examples) — only adds example data + gallery component

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Types/schemas before services/hooks
- Hooks before components
- Components before wiring/integration

### Parallel Examples

**Phase 1 Setup** (all [P] tasks together):
```
T003 tsconfig.json    |  T004 vite.config.ts  |  T005 index.html  |  T006 globals.css
```

**Phase 2 Tests** (all [P] tests together):
```
T010 transpile.test.ts  |  T011 evaluate.test.ts  |  T012 worker-client.test.ts
```

**After US1 complete** (all stories in parallel):
```
US2 (T035–T038)  |  US3 (T039–T042)  |  US4 (T043–T049)  |  US5 (T050–T054)  |  US6 (T055–T060)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T009)
2. Complete Phase 2: Worker Pipeline (T010–T018)
3. Complete Phase 3: User Story 1 (T019–T034)
4. **STOP and VALIDATE**: Editor + live preview + error handling + localStorage persistence
5. Deploy/demo if ready — this is a fully functional playground

### Incremental Delivery

1. Setup + Worker Pipeline → Foundation ready
2. US1 (Live Edit) → **MVP** — test independently → deploy
3. US2 (Metadata) + US3 (Inspect) + US4 (Config) → P2 features → deploy
4. US5 (Sharing) + US6 (Examples) → P3 features → deploy
5. Polish → Final release

### Task Count Summary

| Phase | Story | Tasks | Parallel |
|-------|-------|-------|----------|
| Phase 1: Setup | — | 9 | 4 |
| Phase 2: Worker Pipeline | — | 9 | 3 |
| Phase 3: US1 Live Edit | US1 | 16 | 2 |
| Phase 4: US2 Metadata | US2 | 4 | 0 |
| Phase 5: US3 Inspect | US3 | 4 | 0 |
| Phase 6: US4 Config | US4 | 7 | 1 |
| Phase 7: US5 Sharing | US5 | 5 | 1 |
| Phase 8: US6 Examples | US6 | 6 | 1 |
| Phase 9: Polish | — | 10 | 3 |
| **Total** | | **70** | **15** |

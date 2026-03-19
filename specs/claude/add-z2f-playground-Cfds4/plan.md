# Implementation Plan: Z2F Studio — Interactive Playground

**Branch**: `claude/add-z2f-playground-Cfds4` | **Date**: 2026-03-19 | **Spec**: `specs/claude/add-z2f-playground-Cfds4/spec.md`
**Input**: Feature specification from `/specs/claude/add-z2f-playground-Cfds4/spec.md`

## Summary

Build Z2F Studio, a browser-based interactive playground for zod-to-form. Developers write Zod v4 schemas in a CodeMirror editor and see a live-rendered form preview powered by `@zod-to-form/react`. The playground uses React Hook Form and shadcn/ui internally for its own UI, CodeMirror 6 for the schema editor, and Sucrase for in-browser TypeScript transpilation. State is shareable via URL (lz-string compressed hash) and persisted in localStorage.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**:
- CodeMirror 6 (`@codemirror/state`, `@codemirror/view`, `@codemirror/lang-javascript`, `@codemirror/autocomplete`, `@codemirror/theme-one-dark`) — schema editor
- Sucrase — lightweight in-browser TypeScript → JavaScript transpilation
- lz-string — URL-safe compression for share links
- React 18+ with React Hook Form 7+ — playground's own form/UI state
- shadcn/ui + Tailwind CSS 4 — playground's own UI components (tabs, buttons, panels, dropdowns, dialog)
- `@zod-to-form/core` + `@zod-to-form/react` — workspace dependencies for live form rendering
- Vite — dev server and production build
**Storage**: Browser localStorage (playground session persistence)
**Testing**: Vitest (unit) + Playwright (e2e, optional Phase 3)
**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge — latest 2 versions)
**Project Type**: Single-page web application (new package in monorepo)
**Performance Goals**: Form preview update < 1s after input pause; initial load < 5s on 3G
**Constraints**: No server-side execution; all transpilation + evaluation in-browser; sandbox must prevent arbitrary code execution
**Scale/Scope**: Single page, ~15 components, ~8 example schemas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zod-Native Architecture | PASS | Playground consumes `@zod-to-form/core` which uses Zod v4 internals directly. No intermediate schema representations introduced. |
| II. Processor Registry Pattern | PASS | Playground uses the existing processor registry via `walkSchema()` — no modifications to the core walker. |
| III. Dual-Mode Output | PASS | Playground demonstrates the runtime renderer mode. Does not alter codegen path. |
| IV. Zero Unnecessary Dependencies | JUSTIFIED | New package (`apps/playground`) adds CodeMirror, Sucrase, lz-string, Tailwind, shadcn/ui, Vite. These are justified: CodeMirror is the industry-standard code editor, Sucrase is the lightest TS transpiler (~1MB vs ~40MB for full TypeScript), lz-string is tiny (~5KB) for URL sharing, and Tailwind/shadcn are used internally (not added to core/react/cli). All dependencies are confined to the playground package. See Complexity Tracking. |
| V. Test-First Development | PASS | TDD approach: unit tests for transpilation pipeline, schema evaluation sandbox, URL encoding/decoding. Component tests for editor ↔ preview integration. |
| VI. Type Safety First | PASS | Full strict mode. All playground internal components are typed. Schema evaluation output is typed via `FormField[]` IR. |
| VII. Accessibility by Default | PASS | Playground shell uses semantic HTML, proper focus management between editor/preview tabs, keyboard navigation (CodeMirror is fully keyboard-accessible), ARIA labels on all controls. |

## Project Structure

### Documentation (this feature)

```text
specs/claude/add-z2f-playground-Cfds4/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/
└── playground/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── index.html
    ├── public/
    │   └── favicon.svg
    ├── src/
    │   ├── main.tsx                    # Vite entry point
    │   ├── App.tsx                     # Root app with layout shell
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── PlaygroundShell.tsx  # Split-pane / responsive tab layout
    │   │   │   ├── Header.tsx          # Top bar (logo, share, examples, config)
    │   │   │   └── ResponsiveTabs.tsx  # Tab switcher for narrow screens
    │   │   ├── editor/
    │   │   │   ├── SchemaEditor.tsx    # CodeMirror wrapper component
    │   │   │   └── editor-setup.ts    # CodeMirror extensions & theme config
    │   │   ├── preview/
    │   │   │   ├── FormPreview.tsx     # Live form render + error boundary
    │   │   │   ├── ResultsPanel.tsx    # Submit output / validation errors
    │   │   │   └── ErrorDisplay.tsx    # Schema error message display
    │   │   ├── inspect/
    │   │   │   └── IRInspector.tsx     # FormField[] IR tree viewer
    │   │   ├── config/
    │   │   │   ├── ComponentMapToggle.tsx  # Default / shadcn dropdown
    │   │   │   ├── ConfigImportExport.tsx  # z2f.config upload/download/paste
    │   │   │   └── CustomComponentImport.tsx # Import custom shadcn components
    │   │   └── examples/
    │   │       ├── ExampleGallery.tsx  # Modal/drawer with example list
    │   │       └── examples.ts        # Curated example schema definitions
    │   ├── lib/
    │   │   ├── transpile.ts           # Sucrase TS→JS transpilation
    │   │   ├── evaluate.ts            # Sandboxed schema evaluation
    │   │   ├── share.ts               # lz-string URL encode/decode
    │   │   ├── storage.ts             # localStorage persistence
    │   │   └── config-io.ts           # z2f.config import/export/validation
    │   ├── hooks/
    │   │   ├── usePlaygroundState.ts   # Central state management hook
    │   │   ├── useDebouncedEval.ts     # Debounced transpile → evaluate pipeline
    │   │   └── useMediaQuery.ts        # Responsive breakpoint detection
    │   ├── types/
    │   │   └── playground.ts          # Playground-specific type definitions
    │   └── styles/
    │       └── globals.css            # Tailwind directives + CodeMirror overrides
    └── tests/
        ├── unit/
        │   ├── transpile.test.ts
        │   ├── evaluate.test.ts
        │   ├── share.test.ts
        │   ├── storage.test.ts
        │   └── config-io.test.ts
        └── integration/
            ├── editor-preview.test.tsx
            └── example-loading.test.tsx
```

**Structure Decision**: New `apps/playground` package (not `packages/`) because this is a deployable application, not a library consumed by other packages. The `pnpm-workspace.yaml` will be updated to include `apps/*`.

## Architecture

### Data Flow

```
┌─────────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ CodeMirror   │────▶│ Sucrase  │────▶│ Sandboxed    │────▶│ walkSchema() │
│ (TS source)  │     │ transpile│     │ evaluate()   │     │ → FormField[]│
└─────────────┘     └──────────┘     └──────────────┘     └──────┬───────┘
                                                                  │
                                          ┌───────────────────────┤
                                          │                       │
                                    ┌─────▼─────┐         ┌──────▼───────┐
                                    │ <ZodForm>  │         │ IRInspector  │
                                    │ (preview)  │         │ (inspect)    │
                                    └─────┬─────┘         └──────────────┘
                                          │
                                    ┌─────▼──────┐
                                    │ ResultsPanel│
                                    │ (on submit) │
                                    └────────────┘
```

### Schema Evaluation Sandbox

The sandbox prevents arbitrary code execution while allowing Zod schema definitions:

1. **Transpile**: Sucrase converts TypeScript to JavaScript (stripping types only, no bundling)
2. **Evaluate**: `new Function()` with a controlled scope object containing only:
   - `z` — the Zod v4 namespace
   - `zod` — alias for `z`
   - `core` — selected `@zod-to-form/core` exports (e.g., `defineConfig`)
3. **Import blocking**: Any `import`/`require` statements are stripped or rejected pre-evaluation with a clear error
4. **Timeout**: `setTimeout` wrapper kills evaluation after 3 seconds
5. **Depth limit**: `walkSchema()` already enforces max depth via its existing `maxDepth` option

### Responsive Layout Strategy

- **Wide screens (≥768px)**: Horizontal split-pane with draggable resizer (CSS Grid `grid-template-columns`)
- **Narrow screens (<768px)**: Full-width stacked layout with tab bar switching between "Editor" and "Preview" tabs
- Detection via `useMediaQuery` hook (CSS `matchMedia`)
- The Inspect panel and Results panel are collapsible sections within the Preview pane

### Component Map Switching

The playground lets users switch between `defaultComponentMap` and `shadcnComponentMap` from `@zod-to-form/react`. The selected map is passed as the `components` prop to `<ZodForm>`. When shadcn is selected, the preview area loads Tailwind utility classes so the shadcn stubs render correctly.

### URL Sharing

1. Editor content → lz-string `compressToEncodedURIComponent()` → `#code=<compressed>`
2. On load, check `window.location.hash` for `code=` parameter → decompress → restore editor
3. Schema > 10,000 chars: warn user that URL may be too long for some browsers/services
4. Additional URL params: `#code=...&map=shadcn&tab=inspect` for component map and active tab

### z2f.config Import/Export

- **Import**: File upload (`.json`/`.ts`) or paste JSON into a dialog. Validate against `ZodFormsConfig` schema using `validateConfig()` from `@zod-to-form/core`. Show warnings for invalid fields, apply valid portions.
- **Export**: Serialize current playground config (component map selection, field overrides) as a `z2f.config.json` file. Trigger browser download.

## Implementation Phases

### Phase 1: Core Editor + Preview (P1 — Story 1)

Scaffold the playground app, wire CodeMirror to a debounced transpile→evaluate→render pipeline.

1. Create `apps/playground` package with Vite + React + Tailwind + shadcn/ui
2. Update `pnpm-workspace.yaml` to include `apps/*`
3. Implement `transpile.ts` (Sucrase) + `evaluate.ts` (sandbox) + unit tests
4. Implement `SchemaEditor.tsx` (CodeMirror 6 with TypeScript mode)
5. Implement `FormPreview.tsx` (renders `<ZodForm>` from evaluated schema)
6. Implement `PlaygroundShell.tsx` (split-pane layout)
7. Implement `useDebouncedEval.ts` hook (300ms debounce, error capture)
8. Implement `ErrorDisplay.tsx` (syntax/runtime errors)
9. Implement `storage.ts` (localStorage persistence) + `usePlaygroundState.ts`
10. Add starter schema that loads on first visit
11. Integration test: edit schema → form updates

### Phase 2: Metadata, Inspect, Results (P2 — Stories 2, 3)

12. Implement `ResultsPanel.tsx` (form submit → show parsed values + errors)
13. Implement `IRInspector.tsx` (tree view of `FormField[]`)
14. Verify metadata annotations (`z.registry()`) work in the sandbox
15. Add component map toggle (`ComponentMapToggle.tsx`)

### Phase 3: Config Management (P2 — Story 4)

16. Implement `config-io.ts` (import/export/validate z2f.config)
17. Implement `ConfigImportExport.tsx` dialog
18. Implement `CustomComponentImport.tsx` (load external shadcn components)

### Phase 4: Sharing + Examples (P3 — Stories 5, 6)

19. Implement `share.ts` (lz-string encode/decode) + unit tests
20. Add share button to header
21. Implement `examples.ts` (5+ curated schemas)
22. Implement `ExampleGallery.tsx` modal with categories
23. Add unsaved-changes warning when loading example

### Phase 5: Responsive + Polish

24. Implement `ResponsiveTabs.tsx` + `useMediaQuery.ts` for mobile layout
25. Keyboard accessibility audit (focus management, tab order, ARIA)
26. Performance optimization (lazy-load CodeMirror, code-split examples)
27. Final integration tests

## Complexity Tracking

> Constitution Check violations justified below:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New dependencies in `apps/playground` (CodeMirror, Sucrase, lz-string, Tailwind, shadcn/ui, Vite) | Playground is a standalone app requiring an editor, transpiler, URL encoding, styling, and build tool. Each dependency solves a specific problem with no lighter alternative. | Sucrase chosen over full TypeScript compiler (40MB → ~1MB). lz-string chosen over custom compression. CodeMirror chosen over textarea (syntax highlighting, error gutters needed). All deps are confined to `apps/playground` and do not leak into core/react/cli packages. |

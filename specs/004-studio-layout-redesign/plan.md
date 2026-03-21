# Implementation Plan: Studio Layout Redesign

**Branch**: `004-studio-layout-redesign` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-studio-layout-redesign/spec.md`

## Summary

Redesign the z2f Studio from a two-column layout to a four-quadrant layout: schema editor (top-left), z2f.config editor with Form/.ts tabs (bottom-left), preview/inspect (top-right), code output with React/CLI toggle (bottom-right). The config Form dogfoods `<ZodForm>` for editing configuration. The CLI codegen pipeline runs in-browser for exact output parity. The existing Config button is replaced by an Export button that auto-detects whether to bundle custom components or provide shadcn install instructions.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 18+, CodeMirror 6, Zod v4, React Hook Form 7+, @zod-to-form/core, @zod-to-form/react, fflate (new — zip for export)
**Storage**: Browser localStorage (playground session persistence)
**Testing**: Vitest
**Target Platform**: Browser (SPA, Vite dev server)
**Project Type**: Library monorepo + playground app
**Performance Goals**: <1s preview update after schema/config changes
**Constraints**: All codegen must run in-browser (no Node APIs in playground). Zero new dependencies in core/react/cli packages.
**Scale/Scope**: Single playground app, ~15 files modified/created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zod-Native Architecture | PASS | Config Form uses ZodForm with dynamically-generated Zod schema. Schema walking uses Zod internals throughout. |
| II. Processor Registry | PASS | No walker modifications. Codegen reuses existing processors. |
| III. Dual-Mode Output | PASS | Both runtime and codegen outputs visible side-by-side via toggle. Same FormField[] IR feeds both. |
| IV. Zero Dependencies | PASS (justified) | `fflate` added to playground app only (not core/react/cli). See Complexity Tracking. |
| V. Test-First | PASS | TDD workflow for all new components and logic. |
| VI. Type Safety | PASS | All new types in strict TypeScript. New discriminants are typed unions. |
| VII. Accessibility | PASS | ARIA landmark roles on quadrants, standard tab order (FR-020, FR-021). |

**Post-Design Re-check**: All principles remain satisfied. The codegen extraction maintains dual-mode output parity. The config Form dogfooding validates Principle I in a new context.

## Project Structure

### Documentation (this feature)

```text
specs/004-studio-layout-redesign/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: research findings
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: development guide
├── contracts/           # Phase 1: interface contracts
│   ├── playground-state.ts
│   ├── export.ts
│   └── codegen-browser.ts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── core/src/
│   └── codegen/                    # Extracted browser-safe codegen (from cli)
│       ├── generate.ts             # generateFormComponent() — shared
│       └── templates.ts            # Field templates — shared
├── react/src/                      # No changes
└── cli/src/
    ├── codegen.ts                  # Thin wrapper importing from core/codegen
    └── ...                         # No other changes

apps/playground/src/
├── components/
│   ├── layout/
│   │   ├── PlaygroundShell.tsx     # MODIFY: four-quadrant CSS Grid layout
│   │   ├── Header.tsx              # MODIFY: remove Config button, add Export
│   │   └── ResizeHandle.tsx        # NEW: draggable divider component
│   ├── config/
│   │   ├── ConfigPane.tsx          # NEW: config pane with Form/.ts tabs
│   │   ├── ConfigForm.tsx          # NEW: ZodForm-based config editor
│   │   ├── ConfigImportExport.tsx  # DELETE: replaced by config pane + export
│   │   └── CustomComponentImport.tsx  # No changes
│   ├── preview/
│   │   └── CodeOutput.tsx          # MODIFY: add React/CLI toggle
│   └── editor/
│       └── SchemaEditor.tsx        # No changes (editor setup reused)
├── hooks/
│   └── usePlaygroundState.ts       # MODIFY: add configTab, codeOutputMode, paneSizes
├── lib/
│   ├── config-schema.ts            # NEW: dynamic config Zod schema generator
│   ├── export.ts                   # NEW: export bundle logic (fflate zip)
│   └── config-io.ts                # MODIFY: remove export (moved to export.ts)
├── types/
│   └── playground.ts               # MODIFY: add ConfigTab, CodeOutputMode, PaneSizes
└── App.tsx                         # MODIFY: wire up new panes and state
```

**Structure Decision**: Existing monorepo structure preserved. The key architectural decision is extracting `generateFormComponent()` from `packages/cli/src/codegen.ts` into `packages/core/src/codegen/` so both CLI and playground can import it without pulling Node dependencies. All other changes are within `apps/playground/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `fflate` dependency in playground | Export feature (FR-017/018) requires zip creation for multi-file bundles | DOM APIs don't support multi-file downloads; manual tar implementation would be fragile and larger than fflate (~8KB) |

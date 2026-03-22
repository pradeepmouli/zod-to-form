# Quickstart: Studio Layout Redesign

## Prerequisites

- Node.js 18+, pnpm 9+
- Existing z2f playground running (`pnpm run dev` from repo root)

## Key Changes Overview

1. **Layout**: `PlaygroundShell.tsx` → four-quadrant grid (was two-column)
2. **Config Pane**: New component with Form/.ts sub-tabs (bottom-left quadrant)
3. **Code Output**: Relocated to bottom-right with React/CLI toggle
4. **Header**: Config button removed, Export button added
5. **Codegen**: CLI's `generateFormComponent()` extracted for browser use

## Development Sequence

### Phase 1: Layout Shell
Edit `PlaygroundShell.tsx` to use CSS Grid with 4 quadrant areas. Add ARIA `region` roles. Update mobile tabbed layout to include config and code output tabs.

### Phase 2: Config Pane
Create `ConfigPane.tsx` with Form/.ts sub-tabs. The Form tab renders `<ZodForm>` with a dynamically-generated config schema. The .ts tab reuses the CodeMirror editor setup.

### Phase 3: Code Output Toggle
Modify `CodeOutput.tsx` to add React/CLI mode toggle. Import `generateFormComponent()` from shared codegen module for CLI mode.

### Phase 4: Export Button
Replace Config button in `Header.tsx` with Export button. Implement `exportBundle()` in new `lib/export.ts` using fflate for zip creation.

### Phase 5: Resizable Panes
Add drag handles between quadrants. Store proportions in `PaneSizes` state, persist to localStorage.

## File Locations

| What | Where |
|------|-------|
| Layout shell | `apps/playground/src/components/layout/PlaygroundShell.tsx` |
| Config pane | `apps/playground/src/components/config/ConfigPane.tsx` (new) |
| Config form schema | `apps/playground/src/lib/config-schema.ts` (new) |
| Code output | `apps/playground/src/components/preview/CodeOutput.tsx` (modify) |
| Export logic | `apps/playground/src/lib/export.ts` (new) |
| Shared codegen | `packages/cli/src/codegen.ts` (extract browser-safe subset) |
| State types | `apps/playground/src/types/playground.ts` (extend) |
| Header | `apps/playground/src/components/layout/Header.tsx` (modify) |

## Running Tests

```bash
pnpm test                    # All tests
pnpm --filter playground test  # Playground tests only
pnpm run type-check          # TypeScript strict check
```

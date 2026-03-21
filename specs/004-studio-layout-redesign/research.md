# Research: Studio Layout Redesign

**Feature**: 004-studio-layout-redesign | **Date**: 2026-03-20

## Research Findings

### R1: CLI Codegen Browser Compatibility

**Decision**: Extract browser-compatible codegen from `packages/cli/src/codegen.ts` and `packages/cli/src/templates.ts` into a shared module importable by the playground.

**Rationale**: The CLI's `generateFormComponent()` and template functions are pure string manipulation with no Node.js dependencies. The Node-specific parts are: `jiti` (schema loading), `chokidar` (file watching), `commander` (CLI), and `fs` (file I/O). The codegen itself only imports `getEmptyDefault` from `@zod-to-form/core` — fully browser-compatible.

**Alternatives Considered**:
- Re-implement codegen in playground: Rejected — violates DRY and risks output divergence (FR-008 requires exact match)
- Bundle entire CLI package: Rejected — pulls in Node dependencies (jiti, chokidar, commander)

**Action**: Move `codegen.ts` and `templates.ts` into `packages/core/src/codegen/` or create a shared entry point in `packages/cli` that excludes Node dependencies. The playground imports only the codegen functions.

### R2: Zip Library for Export

**Decision**: Use `fflate` for client-side zip generation.

**Rationale**: fflate is ~8KB gzipped, has zero dependencies, runs in browser and Node, and is the fastest pure-JS zip implementation. The export feature (FR-017) needs zip only when custom components are loaded — otherwise it's a single `.ts` file download.

**Alternatives Considered**:
- JSZip: 45KB gzipped, heavier API, slower — overkill for simple zip creation
- No zip (download multiple files): Poor UX — browsers don't support multi-file downloads cleanly
- tar.gz: Less familiar to frontend developers

**Justification per Constitution Principle IV**: fflate is needed only in the playground app (not core/react/cli packages), is minimal, and enables a core user story (export). No alternative achieves the same UX without a dependency.

### R3: Config Form Schema (Dogfooding)

**Decision**: Define a Zod schema for `PlaygroundConfig` that is derived dynamically from the user's current schema shape. Each top-level field in the user's schema generates a config entry with component override, label, placeholder, order, hidden, and gridColumn fields.

**Rationale**: The config Form uses `<ZodForm>` (dogfooding). This requires a Zod schema as input. Since config fields map 1:1 to the user's schema fields, the config schema must be generated at runtime when the schema changes.

**Alternatives Considered**:
- Static config schema: Rejected — config fields depend on user's schema shape, which is dynamic
- JSON editor instead of ZodForm: Rejected — defeats the dogfooding purpose (FR-003, SC-005)

### R4: Resizable Panes Implementation

**Decision**: Use CSS resize handles with pointer events and CSS custom properties for pane proportions. No external library.

**Rationale**: The resize behavior is simple (3 draggable dividers). CSS custom properties (`--left-col`, `--top-left`, `--top-right`) updated via pointer events give smooth, GPU-accelerated resizing. Proportions persist to localStorage alongside existing state.

**Alternatives Considered**:
- react-resizable-panels: Adds ~15KB dependency for functionality achievable in ~100 lines
- CSS `resize` property: Doesn't support linked/proportional resizing between adjacent panes

### R5: Existing Code Editor Reuse

**Decision**: Reuse existing CodeMirror 6 setup from `editor-setup.ts` for the config .ts view. Extract shared editor configuration.

**Rationale**: The schema editor already uses CodeMirror 6 with JavaScript/TypeScript support, One Dark theme, and full feature set. The .ts config view needs identical functionality. Extracting the editor setup avoids duplication.

### R6: defineConfig in Exports

**Decision**: The export generates a `z2f.config.ts` file using the existing `defineConfig()` function from `@zod-to-form/core`. The file format is:

```typescript
import { defineConfig } from "@zod-to-form/core";

export default defineConfig({
  // ... serialized config
});
```

**Rationale**: `defineConfig()` already exists in core (config.ts:392-409) with full type safety and preset support. Using it in the export ensures the exported file is immediately usable in a real project with the CLI.

# Implementation Plan: Rune Integration Additions

**Branch**: `[002-zodform-rune-integration]` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-zodform-rune-integration/spec.md`

## Summary

Implement processor API usability improvements, auto-save runtime lifecycle support, and unified component configuration across CLI and runtime. The feature preserves the existing `FormField[]` pipeline, adds deterministic mapping precedence and validation behavior, and keeps all outputs framework-agnostic with no Next.js dependency.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Zod v4, React 18+, React Hook Form 7+, `@hookform/resolvers`, commander, jiti, prettier, chokidar  
**Storage**: N/A  
**Testing**: Vitest (unit + integration), TypeScript compile checks for generated output  
**Target Platform**: Node.js CLI + React runtime for browser-compatible apps  
**Project Type**: pnpm workspace monorepo libraries (`core`, `react`, `cli`)  
**Performance Goals**: Preserve existing walker/codegen throughput; cache runtime module import for configured components after first load  
**Constraints**: No Next.js-specific dependency; generated code must remain standalone; TDD and strict typing required by constitution  
**Scale/Scope**: Updates across `packages/core`, `packages/react`, `packages/cli`, docs, and tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Zod-Native Architecture**: PASS — feature extends processors and metadata usage without schema-conversion intermediates.
- **II. Processor Registry Pattern**: PASS — built-in processor exports and custom override docs strengthen registry-based extensibility.
- **III. Dual-Mode Output**: PASS — both runtime and codegen continue consuming shared `FormField[]` output.
- **IV. Zero Unnecessary Dependencies**: PASS — no new non-justified deps; no Next.js dependency introduced.
- **V. Test-First Development**: PASS (planned) — implementation will begin with failing tests per package.
- **VI. Type Safety First**: PASS — plan includes generic config exports and compile-time key validation semantics.
- **VII. Accessibility by Default**: PASS — rendering changes are configuration-driven and must preserve existing accessibility behavior.

**Post-Design Constitution Re-check**: PASS — research, data model, contracts, and quickstart artifacts remain aligned with all seven principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-zodform-rune-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
packages/
├── core/
│   ├── src/
│   │   ├── processors/
│   │   ├── walker.ts
│   │   └── index.ts
│   └── tests/
│       ├── processors/
│       └── integration/
├── react/
│   ├── src/
│   │   ├── useZodForm.ts
│   │   ├── ZodForm.tsx
│   │   └── FieldRenderer.tsx
│   └── tests/
│       ├── useZodForm.test.ts
│       ├── ZodForm.test.tsx
│       └── integration/
└── cli/
    ├── src/
    │   ├── index.ts
    │   ├── codegen.ts
    │   ├── templates.ts
    │   └── loader.ts
    └── tests/
        ├── codegen.test.ts
        └── integration/
```

**Structure Decision**: Keep existing monorepo package boundaries. `core` handles processor and walker logic, `react` handles runtime lifecycle/config consumption, and `cli` handles generation/config loading and code emission.

## Complexity Tracking

No constitution violations or complexity exceptions require justification for this plan.

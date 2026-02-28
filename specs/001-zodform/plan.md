# Implementation Plan: zodform — Schema-Driven Form Generation

**Branch**: `001-zodform` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-zodform/spec.md`

## Summary

zodform is a schema-driven form generation library for Zod v4 that walks Zod's internal type tree using a processor registry pattern (mirroring `z.toJSONSchema()`) to produce a `FormField[]` intermediate representation. This IR is consumed by two independent output modes: a runtime `<ZodForm>` React component (via React Hook Form + zodResolver) and a CLI code generator that emits static `.tsx` files with zero runtime dependency on zodform. The core walker, processors, and metadata resolution are shared across both modes to guarantee behavioral equivalence.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode
**Primary Dependencies**: Zod v4 (v4.0.0+), React 18+, React Hook Form 7+, @hookform/resolvers (zodResolver)
**CLI Dependencies**: commander (arg parsing), jiti (dynamic TS import), prettier (output formatting), chokidar (watch mode)
**Storage**: N/A — no server-side storage; all state is in-memory form state via React Hook Form
**Testing**: Vitest (unit/integration), @testing-library/react (component tests)
**Target Platform**: npm package consumed in Node.js (CLI) and browser (React runtime)
**Project Type**: pnpm monorepo with 3 packages (packages/core, packages/react, packages/cli)
**Performance Goals**: Schema walk <10ms for 50-field schemas; CLI codegen <10s including file I/O; runtime re-render only on schema reference change (memoized walk)
**Constraints**: Zero runtime dependencies in core (peer dep on zod only); zero zodform runtime dependency in generated code; tree-shakeable exports
**Scale/Scope**: Support 20+ Zod types, schemas up to ~200 fields with nesting, arrays, and discriminated unions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Zod-Native Architecture | PASS | Structural introspection uses `schema.def` (fallback `schema._zod.def`); constraints use `schema._zod.bag`; wrapper/optionality use `schema._zod.parent` and `schema._zod.optin/optout`. No intermediate JSON Schema conversion. Metadata via `z.globalRegistry` and `z.registry<FormMeta>()`. |
| II. Processor Registry Pattern | PASS | Core walker dispatches by `def.type` to registered processors. Adding a new Zod type requires only a new processor entry. Custom processors registrable by consumers. |
| III. Dual-Mode Output | PASS | Core produces `FormField[]` consumed independently by runtime renderer and CLI codegen. Both share identical walker and processors. |
| IV. Zero Unnecessary Dependencies | PASS | `core` has zero deps (zod peer). `react` uses only peer deps. `cli` has justified direct deps (commander, jiti, prettier, chokidar). Generated code imports only from RHF, zod, and user's UI lib. |
| V. Test-First Development | PASS | Plan mandates TDD: failing tests before implementation for every processor, the walker, the renderer, and the CLI. |
| VI. Type Safety First | PASS | `z.infer<typeof schema>` propagates through RHF to `onSubmit`. Public APIs use generics. Strict mode enforced. Generated code passes `tsc --noEmit`. |
| VII. Accessibility by Default | PASS | All rendered/generated forms include `<label>` with `htmlFor`, `aria-invalid`, `required`, `FormMessage`, `FormDescription`, logical tab order. |

**Gate Result**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-zodform/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (TypeScript interfaces)
│   ├── core-api.ts      # FormField, FormProcessor, FormProcessorContext, FormMeta types
│   ├── react-api.ts     # ZodForm props, ComponentMap, useZodForm hook
│   └── cli-api.ts       # CLI options, CodegenConfig, generated file structure
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── core/                        # @zod-to-form/core — schema walker & processors
│   ├── src/
│   │   ├── index.ts             # Public API exports
│   │   ├── types.ts             # FormField, FormProcessor, FormProcessorContext, FormMeta
│   │   ├── walker.ts            # Recursive schema walker (process function)
│   │   ├── registry.ts          # Processor registry with built-in processors
│   │   ├── metadata.ts          # Metadata resolution (form registry → global registry)
│   │   ├── utils.ts             # Label inference, path helpers, cycle detection
│   │   └── processors/          # One file per Zod type family
│   │       ├── string.ts        # string, template_literal
│   │       ├── number.ts        # number, bigint
│   │       ├── boolean.ts       # boolean
│   │       ├── date.ts          # date
│   │       ├── enum.ts          # enum, nativeEnum, literal
│   │       ├── file.ts          # file
│   │       ├── object.ts        # object (recurse into shape), intersection (merge shapes)
│   │       ├── array.ts         # array, tuple
│   │       ├── union.ts         # union, discriminatedUnion
│   │       ├── wrappers.ts      # optional, nullable, default, readonly, pipe, catch, lazy
│   │       └── fallback.ts      # transform, custom, record, any, unknown
│   ├── tests/
│   │   ├── walker.test.ts
│   │   ├── metadata.test.ts
│   │   ├── processors/          # One test file per processor file
│   │   │   ├── string.test.ts
│   │   │   ├── number.test.ts
│   │   │   ├── boolean.test.ts
│   │   │   ├── date.test.ts
│   │   │   ├── enum.test.ts
│   │   │   ├── file.test.ts
│   │   │   ├── object.test.ts
│   │   │   ├── array.test.ts
│   │   │   ├── union.test.ts
│   │   │   ├── wrappers.test.ts
│   │   │   └── fallback.test.ts
│   │   └── integration/
│   │       └── full-schema.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── react/                       # @zod-to-form/react — runtime renderer
│   ├── src/
│   │   ├── index.ts             # Public API exports
│   │   ├── ZodForm.tsx          # <ZodForm> component
│   │   ├── useZodForm.ts        # Hook: schema → useForm + FormField[]
│   │   ├── FieldRenderer.tsx    # Recursive field renderer (FormField → JSX)
│   │   ├── components/          # Default unstyled HTML primitives
│   │   │   ├── index.ts         # Default ComponentMap
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Switch.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── FileInput.tsx
│   │   │   └── RadioGroup.tsx
│   │   └── shadcn/              # Optional shadcn/ui component map
│   │       └── index.ts         # shadcnComponentMap export
│   ├── tests/
│   │   ├── ZodForm.test.tsx
│   │   ├── useZodForm.test.ts
│   │   ├── FieldRenderer.test.tsx
│   │   └── integration/
│   │       ├── runtime-form.test.tsx
│   │       └── equivalence.test.tsx  # Runtime vs codegen behavioral equivalence
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
└── cli/                         # @zod-to-form/cli — build-time code generator
    ├── src/
    │   ├── index.ts             # CLI entry point (commander setup)
    │   ├── codegen.ts           # FormField[] → .tsx source string
    │   ├── templates.ts         # Code templates for form components
    │   ├── server-action.ts     # Next.js server action generator
    │   ├── loader.ts            # Dynamic schema import via jiti
    │   ├── watcher.ts           # File watch mode via chokidar
    │   └── format.ts            # Prettier formatting wrapper
    ├── tests/
    │   ├── codegen.test.ts
    │   ├── loader.test.ts
    │   ├── server-action.test.ts
    │   └── integration/
    │       ├── cli-e2e.test.ts
    │       └── generated-compiles.test.ts  # tsc --noEmit on output
    ├── package.json
    ├── tsconfig.json
    └── vitest.config.ts
```

**Structure Decision**: pnpm monorepo with three packages under `packages/`. This aligns with the constitution's technology stack (pnpm workspaces) and Principle III (Dual-Mode Output) by separating the shared core from the two output modes. The `core` package has zero dependencies beyond the `zod` peer dependency (Principle IV).

## Complexity Tracking

> No constitution violations — no justifications needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |

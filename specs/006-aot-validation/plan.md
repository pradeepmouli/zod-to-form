# Implementation Plan: Validation Optimization

**Branch**: `006-validation-optimization` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-validation-optimization/spec.md`

## Summary

Progressive decomposition of composed Zod schemas into per-field validation, eliminating `zodResolver` overhead through three optimization levels. The optimizer registry runs after the existing processor registry during the schema walk, mutating `FormField` with validation strategy metadata. Both runtime (`FieldRenderer`) and codegen (`generateFormComponent`) consume the new `validation` property to emit optimized validation code.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode
**Primary Dependencies**: Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), @hookform/resolvers (peer — conditional after optimization)
**Storage**: N/A (library)
**Testing**: Vitest
**Target Platform**: Browser (React applications)
**Project Type**: Library (monorepo: core, react, codegen/cli)
**Performance Goals**: O(1) per-keystroke validation (single field) instead of O(N) full-tree walk
**Constraints**: Strict validation equivalence with zodResolver (FR-017); zero new runtime dependencies (Principle IV)
**Scale/Scope**: Touches packages/core (walker, types, registry), packages/react (useZodForm, FieldRenderer), packages/codegen (templates, generate)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zod-Native Architecture | PASS | Optimizers read `schema._zod.bag` and `schema._zod.def` — same substrate as processors. SchemaLite built from Zod primitives. No intermediate schema representation introduced. |
| II. Processor Registry Pattern | PASS | Optimizer registry follows identical pattern: `Record<string, FormOptimizer[]>`, dispatch by `def.type`, extensible via custom optimizers. Walk loop extended, not modified. |
| III. Dual-Mode Output | PASS | `FormField.validation` is consumed by both runtime renderer and codegen emitter. Same walk produces same FormField[] regardless of mode. |
| IV. Zero Unnecessary Dependencies | PASS | No new dependencies. Optimization *removes* `@hookform/resolvers` dependency in codegen output at L2. Runtime keeps it as optional peer. |
| V. Test-First Development | PASS | Each optimization level has independently testable acceptance scenarios. Equivalence tests compare optimized vs zodResolver output. |
| VI. Type Safety First | PASS | `FormField.validation` is fully typed. Optimizer signatures use generics matching processor pattern. |
| VII. Accessibility by Default | PASS | Optimization affects validation plumbing only — labels, aria attributes, error messages unchanged. Error message text preserved from Zod schema. |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/006-validation-optimization/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── optimizer-api.md # Public optimizer API contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── core/src/
│   ├── types.ts                    # MODIFY — add FormField.validation, FormOptimizer types
│   ├── walker.ts                   # MODIFY — integrate optimizer chain after processor dispatch
│   ├── registry.ts                 # MODIFY — add createOptimizers() factory
│   ├── config.ts                   # MODIFY — add optimization config to ZodFormsConfig
│   ├── optimizers/                 # NEW — optimizer implementations
│   │   ├── index.ts                # Barrel export + createOptimizers
│   │   ├── types.ts                # FormOptimizer, FormOptimizerContext, SchemaLiteCollector
│   │   ├── schema-lite.ts          # SchemaLiteCollector implementation
│   │   ├── l1-decompose.ts         # Level 1: per-field Zod schema extraction
│   │   ├── l2-native-rules.ts      # Level 2: Zod → native RHF rule conversion
│   │   └── constraint-map.ts       # Zod constraint → RHF rule mapping table
│   └── __tests__/
│       ├── optimizers/
│       │   ├── l1-decompose.test.ts
│       │   ├── l2-native-rules.test.ts
│       │   ├── l3-cross-field.test.ts
│       │   ├── schema-lite.test.ts
│       │   └── equivalence.test.ts  # zodResolver vs optimized output comparison
│       └── walker-optimization.test.ts
├── react/src/
│   ├── useZodForm.ts               # MODIFY — conditional zodResolver vs per-field validation
│   ├── FieldRenderer.tsx            # MODIFY — consume field.validation for register() options
│   ├── SchemaLiteSubmit.ts          # NEW — submit-time schemaLite validation utility (pure function, no JSX)
│   └── __tests__/
│       └── optimized-validation.test.ts
└── codegen/src/
    ├── templates.ts                 # MODIFY — emit optimized validation code per field.validation.mode
    ├── generate.ts                  # MODIFY — conditional zod import, hoisted validators
    └── __tests__/
        └── codegen-optimization.test.ts
```

**Structure Decision**: Optimizers live in `packages/core/src/optimizers/` as a new module parallel to `packages/core/src/processors/`. This matches the existing processor directory structure and keeps optimizer logic isolated from the walk loop.

## Phase Design

### Phase 1: Core IR & Optimizer Infrastructure (Level 1 foundation)

**Goal**: Extend `FormField` with validation properties, implement `FormOptimizer` types, `SchemaLiteCollector`, and integrate the optimizer chain into the walker. No behavioral change yet — optimizers are no-ops unless optimization is enabled in config.

**Files touched**:
- `packages/core/src/types.ts` — Add `FormField.zodSchema`, `FormField.validation`, `FormOptimizerContext`
- `packages/core/src/optimizers/types.ts` — `FormOptimizer`, `SchemaLiteCollector` interface
- `packages/core/src/optimizers/schema-lite.ts` — SchemaLiteCollector implementation
- `packages/core/src/optimizers/index.ts` — `createOptimizers()`, `builtinOptimizers`
- `packages/core/src/walker.ts` — After processor dispatch, run optimizer chain if `options.optimizers` provided
- `packages/core/src/config.ts` — Add `optimization?: { level?: 1 | 2 | 3 }` to `ZodFormsConfig.defaults`
- `packages/core/src/registry.ts` — Export `createOptimizers`

**Key design decisions**:
- Optimizer chain runs after processor has fully populated the field (including metadata overlays)
- `WalkOptions` gains `optimizers?: Record<string, FormOptimizer[]>` and `optimizerContext?: FormOptimizerContext`
- SchemaLiteCollector is created before the walk and passed via context; evaluated after walk completes
- Walker returns `{ fields: FormField[], schemaLite: $ZodType | null }` when optimization is enabled (backward-compatible — returns `FormField[]` when not)

### Phase 2: Level 1 — Decompose Tree

**Goal**: Implement L1 optimizers that extract per-field `zodSchema` from the walk and populate `field.validation.mode = 'zodSchema'`. Implement runtime and codegen consumption.

**Files touched**:
- `packages/core/src/optimizers/l1-decompose.ts` — L1 optimizer for each processor type
- `packages/react/src/useZodForm.ts` — When optimization enabled: skip zodResolver, pass per-field validators via form context
- `packages/react/src/FieldRenderer.tsx` — When `field.validation?.mode === 'zodSchema'`, add `validate` to `register()` options
- `packages/react/src/SchemaLiteSubmit.tsx` — Wrap `onSubmit` with schemaLite `safeParse` + `setError` mapping
- `packages/codegen/src/templates.ts` — Emit hoisted `const _fieldName = z.TYPE.CONSTRAINTS` and `register({ validate })` instead of zodResolver
- `packages/codegen/src/generate.ts` — Conditional `@hookform/resolvers` import (omit when optimized)

**L1 optimizer algorithm per type**:
1. Read `schema._zod.def` and `schema._zod.bag` to reconstruct the atomic Zod schema
2. Store on `field.zodSchema = schema` (the original Zod node — already constructed, no new allocation)
3. Set `field.validation = { mode: 'zodSchema' }`
4. For wrapper types (optional, nullable, default, pipe): store the unwrapped inner schema
5. Top-level refines/transforms: detected in walker pre-pass, added to SchemaLiteCollector

### Phase 3: Level 2 — Native Rules

**Goal**: Implement L2 optimizers that convert simple constraints to native RHF rules. Implements strict equivalence (FR-017) — if a constraint can't be perfectly replicated, falls back to atomic Zod.

**Files touched**:
- `packages/core/src/optimizers/l2-native-rules.ts` — L2 optimizer: reads `field.constraints` + `field.zodSchema`, emits `field.validation.rules`
- `packages/core/src/optimizers/constraint-map.ts` — Mapping table: Zod constraint → RHF rule with error message extraction
- `packages/react/src/FieldRenderer.tsx` — When `field.validation?.mode === 'native'`, pass `field.validation.rules` to `register()`
- `packages/codegen/src/templates.ts` — Emit native rule props; conditionally emit `zod` import
- `packages/codegen/src/generate.ts` — Track whether any field needs Zod; omit import if not

**Strict equivalence approach**:
- `min/max/minLength/maxLength` → direct RHF rules (semantically identical)
- `pattern` (explicit regex) → direct RHF pattern (identical regex)
- `email/uuid/url` → extract Zod's *actual* internal regex from `schema._zod.bag` at walk time, use that exact regex as the RHF pattern (guarantees identical matching)
- `required` → `register({ required: message })` (identical semantics)
- `refine/transform` → stay as atomic Zod (no native equivalent)
- Any constraint not in the mapping table → stay as atomic Zod (safety net)

**Component enforcement** (no validation emitted):
- `z.enum([...])` → Select/RadioGroup: `field.validation = { mode: 'component-enforced' }`
- `z.boolean()` → Checkbox/Switch: `field.validation = { mode: 'component-enforced' }`
- `z.literal(v)` → pre-filled: `field.validation = { mode: 'component-enforced' }`

### Phase 4: Level 3 — Cross-Field UX

**Goal**: Implement L3 optimizers that convert analyzable superRefines to `watch()` + `validate` patterns for real-time cross-field feedback.

**Files touched**:
- `packages/core/src/optimizers/l3-cross-field.ts` — L3 optimizer: analyze superRefine functions for static patterns
- `packages/react/src/FieldRenderer.tsx` — When `field.validation?.mode === 'watch'`, use `useWatch` + validate
- `packages/codegen/src/templates.ts` — Emit `watch()` + `validate` code for watch-mode fields
- `packages/core/src/optimizers/schema-lite.ts` — Remove converted superRefines from collector; discard if empty

**Static analysis scope** (conservative — only convert patterns we can prove correct):
- Top-level `superRefine` with `ctx.addIssue({ path: ['literal'] })` where path is a string literal
- Function body references `data.fieldA` and `data.fieldB` — extract field names as watch targets
- Comparison patterns: `===`, `!==`, `<`, `>`, `<=`, `>=` between watched fields
- Everything else stays in schemaLite (safe fallback)

### Phase 5: Integration & Config

**Goal**: Wire optimization level into `z2f.config.ts`, ensure backward compatibility, add CLI flag for codegen.

**Files touched**:
- `packages/core/src/config.ts` — Add `optimization?: { level?: 1 | 2 | 3 }` to `ConfigDefaults`
- `packages/cli/src/commands/generate.ts` — Read config, pass optimization level to walker + codegen
- `packages/react/src/useZodForm.ts` — Read config from context/props, pass to walker
- Integration tests across all three packages

## Complexity Tracking

No constitution violations. No complexity justification needed.

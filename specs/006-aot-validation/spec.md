# Feature Specification: Validation Optimization

**Feature Branch**: `006-aot-validation`
**Created**: 2026-03-26
**Status**: Implemented (L1/L2), Deferred (L3)
**Input**: Progressive decomposition of composed Zod schemas into per-field validation, eliminating zodResolver overhead through optimization levels (decompose tree, native rules). Cross-field UX (L3) is deferred pending Zod v4 API for superRefine function extraction.

## Clarifications

### Session 2026-03-26

- Q: Must optimized validation produce semantically identical accept/reject results to zodResolver for all inputs? → A: Strict equivalence — optimized must match zodResolver accept/reject for all inputs; if a native rule can't perfectly replicate a Zod validator, fall back to atomic Zod.
- Q: How is runtime optimization configured — global, per-form, or both? → A: Global only — single optimization level configured in z2f.config.ts, read by both runtime and codegen.

### Session 2026-03-28

- Q: What config key name? → A: `optimization` (not `validation` — describes what it optimizes, not the domain).
- Q: How does schemaLite handle `.loose()` security? → A: `.loose()` is required to pass through form fields validated per-field. Server-side handlers MUST validate the full schema. Documented in Security Note.
- Q: Should codegen use the full schema for submit-time validation? → A: No — codegen generates a `.lite.ts` file that constructs the lite schema by extracting checks from the imported schema at module load time.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Per-Field Validation Decomposition (Priority: P1)

As a developer using zod-to-form (runtime or codegen), I want the library to decompose my composed Zod schema into isolated per-field validators so that each keystroke only validates the changed field — not the entire form tree.

**Why this priority**: This is the foundational optimization. Every subsequent level builds on the decomposed per-field validation structure. Without this, zodResolver re-validates all fields on every change, which is the primary performance bottleneck for large forms.

**Independent Test**: Can be fully tested by generating a form from a multi-field Zod schema and verifying that (a) no zodResolver is used, (b) each field validates independently via `register({ validate })`, and (c) top-level refines/transforms are captured in a schemaLite and run only on submit.

**Acceptance Scenarios**:

1. **Given** a Zod object schema with 5+ fields and no top-level refines, **When** the form is generated (runtime or codegen), **Then** each field has an isolated validator using `register({ validate })` and no zodResolver or schemaLite is present.
2. **Given** a Zod object schema with a top-level `superRefine`, **When** the form is generated, **Then** per-field validators are emitted for individual fields AND a schemaLite containing only the superRefine is emitted with a submit-time `safeParse` handler.
3. **Given** a field that cannot be safely inlined (safety net), **When** the optimizer encounters it, **Then** the field's schema is added to schemaLite's shape via `pick()` from the parent schema rather than silently dropping validation.
4. **Given** a generated form, **When** a user types in one field, **Then** only that field's validator runs — not the validators for other fields.

---

### User Story 2 - Native RHF Rule Replacement (Priority: P2)

As a developer, I want simple Zod constraints (min, max, pattern, required) to be replaced with native React Hook Form rules so that most fields validate without calling Zod at runtime, and in codegen mode the `zod` import can be dropped entirely when no refines remain.

**Why this priority**: After decomposition, most fields still call `safeParse` on every keystroke. Replacing these with native RHF rules eliminates Zod execution for the majority of fields, and in codegen enables tree-shaking the `zod` dependency entirely for simple forms.

**Independent Test**: Can be tested by generating a form from a schema with only simple constraints (min/max/email/required) and verifying that (a) no hoisted Zod validators exist, (b) `register()` uses native RHF rules with correct values and error messages, and (c) in codegen, no `zod` import is present.

**Acceptance Scenarios**:

1. **Given** a field with `z.string().min(2).max(100)`, **When** Level 2 optimization is enabled, **Then** the field registers with `{ minLength: { value: 2, message }, maxLength: { value: 100, message } }` and no hoisted Zod validator exists for it.
2. **Given** a field with `z.string().email()`, **When** Level 2 optimization is enabled, **Then** the field registers with a `pattern` rule containing the email regex and error message extracted from the Zod schema's `_zod.bag.patterns`.
3. **Given** a field with `z.string().min(2).refine(customFn)`, **When** Level 2 optimization is enabled, **Then** the entire chain is kept as a hoisted atomic Zod validator (no partial conversion).
4. **Given** a form where all fields convert to native rules and no schemaLite exists, **When** codegen runs at Level 2, **Then** the generated file contains no `zod` import.
5. **Given** a `z.enum([...])` field rendered as a Select component, **When** Level 2 optimization is enabled, **Then** no validation is emitted for that field (component enforcement).
6. **Given** a field with `z.number().gt(5)` (exclusive bound), **When** Level 2 optimization is enabled, **Then** the field stays as atomic Zod (RHF `min`/`max` rules are always inclusive, so exclusive bounds cannot be mapped).

---

### User Story 3 - Cross-Field Real-Time UX (Priority: P3 — DEFERRED)

**Status**: Deferred. L3 infrastructure (types, hooks, codegen scaffolding) exists as commented-out TODO(L3) code. Blocked on Zod v4 not exposing the superRefine callback function from its check objects — the function is captured in a closure and not directly accessible for static analysis.

As a developer, I want analyzable cross-field superRefines (e.g., password confirmation) to provide real-time validation feedback as the user types, instead of only surfacing errors on form submission.

**Acceptance Scenarios**: (unchanged, deferred)

1. **Given** a top-level `superRefine` that compares `password` and `confirmPassword` with a static `ctx.addIssue({ path: ['confirmPassword'] })`, **When** Level 3 optimization is enabled, **Then** the confirmPassword field registers with a `validate` function that uses `watch('password')` for real-time feedback.
2. **Given** a `superRefine` with dynamic `ctx.addIssue({ path: [computed] })`, **When** Level 3 optimization is enabled, **Then** the superRefine remains in schemaLite (not converted).
3. **Given** all schemaLite entries were analyzable superRefines that Level 3 converted, **When** optimization completes, **Then** schemaLite is discarded (empty).

---

### User Story 4 - Custom Optimizer Registration (Priority: P3)

As a developer with custom components that enforce constraints (e.g., a DateRangePicker that guarantees `startDate < endDate`), I want to register custom optimizers so that the library recognizes my component's implicit validation and strips redundant Zod checks.

**Why this priority**: Extensibility story. The optimizer registry mirrors the existing processor registry pattern, maintaining the library's design philosophy. Not needed for MVP but critical for advanced users.

**Independent Test**: Can be tested by registering a custom optimizer for a `DateRangePicker` component and verifying that the associated refine is stripped from validation output.

**Acceptance Scenarios**:

1. **Given** a registered custom optimizer for `date` type that sets `validation.mode = 'component-enforced'`, **When** a date field is processed, **Then** no Zod validator or native rule is emitted for that field.
2. **Given** no custom optimizer is registered for a type, **When** that type is processed, **Then** the default optimization chain (L1/L2) applies normally.
3. **Given** custom optimizers for a type, **When** `createOptimizers` merges them, **Then** they replace (not append to) the entire builtin chain for that type — same merge semantics as `createProcessors`.

---

### Edge Cases

- What happens when a field has both simple constraints AND a refine? The entire chain is kept as one hoisted atomic Zod validator — no partial native rule extraction.
- What happens when schemaLite has fallthrough fields? Their schemas are included in the lite object shape via `pick()` from the parent, preserving their validation while keeping the rest loose.
- What happens when a `transform()` exists on a field? It stays as a hoisted atomic Zod validator because the output type may differ from input.
- What happens when a top-level `transform()` exists on the schema? The transform function is extracted from the pipe wrapper's `def.out._zod.def.transform` and replayed onto the lite schema. Checks before and after the transform are also preserved.
- What happens when the optimization level is set higher than what's needed (e.g., Level 3 but no cross-field dependencies)? Each level is a no-op when nothing matches — no errors, no unnecessary output. Level 3 currently behaves identically to Level 2.
- What happens when a field uses `z.pipe()` chains? Non-transform pipes (e.g., `z.object().pipe(otherSchema)`) use the original schema for schemaLite since they can't be decomposed. Transform pipes are decomposed.
- What happens when a field uses `z.lazy()`? The lazy wrapper is unwrapped to its inner schema and delegated to the appropriate L1 optimizer (same as other wrapper types like optional/nullable/default).
- What happens when optimization is disabled? The system falls back to the current zodResolver behavior with zero changes to output.
- What happens when `z.number().gt(5)` or `z.number().lt(10)` (exclusive bounds) are used? The optimizer detects `bag.exclusiveMinimum` / `bag.exclusiveMaximum` and falls back to atomic Zod since RHF's `min`/`max` rules are always inclusive.

### Security Note

SchemaLite uses `.loose()` to allow form fields not in its shape to pass through — this is required because per-field validators handle those fields client-side. The lite schema only validates top-level effects (superRefine/refine/transform), not the data shape. **Server-side handlers MUST validate the full schema** (e.g. `schema.safeParse(req.body)`) to reject injected fields and enforce field-level type constraints. Client-side optimization does not replace server-side validation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST decompose a composed Zod object schema into isolated per-field validators during the schema walk (Level 1).
- **FR-002**: System MUST collect top-level effects into a SchemaLiteCollector via `addCheck()` (for superRefine/refine checks), `addTransform()` (for transform functions), or `setOriginalSchema()` (for non-decomposable pipes). The collector builds the lite schema for submit-time validation.
- **FR-003**: System MUST discard schemaLite when it contains no effects (no checks, no transforms, no fallthrough fields, no original schema).
- **FR-004**: System MUST hoist per-field Zod schemas to avoid per-keystroke allocation (created once, reused across validations).
- **FR-005**: System MUST replace simple Zod constraints with native RHF rules when Level 2 is enabled, reading constraints from `_zod.bag` exclusively (Constitution Principle I) and preserving error messages extracted from the checks array.
- **FR-006**: System MUST keep the entire Zod chain as a hoisted atomic validator when a field has both simple constraints and a refine/transform, or when any check type is unknown/undefined (safety fallback).
- **FR-007**: System MUST recognize component-enforced validation by checking `field.zodType` against the set `['enum', 'boolean', 'literal']` and emit no validation for those fields at Level 2.
- **FR-008**: System MUST conditionally include the `zod` and `@hookform/resolvers` imports in codegen output — only when needed by the chosen validation strategy.
- **FR-009**: *(DEFERRED — L3)* System MUST convert statically analyzable cross-field superRefines to real-time watch/validate patterns when Level 3 is enabled. Blocked on Zod v4 not exposing superRefine callback functions from check objects.
- **FR-010**: *(DEFERRED — L3)* System MUST leave opaque/dynamic superRefines in schemaLite when they cannot be statically analyzed. Currently all superRefines stay in schemaLite since L3 is not implemented.
- **FR-011**: System MUST support an optimizer registry parallel to the existing processor registry, with per-type optimizer chains dispatched by `def.type`.
- **FR-012**: System MUST support custom optimizer registration. Custom optimizers for a type replace the entire builtin chain for that type (`{ ...builtinOptimizers, ...custom }`) — same merge semantics as `createProcessors`.
- **FR-013**: System MUST add `zodSchema?: $ZodType` and `validation?: ValidationStrategy` properties to the FormField IR. `zodSchema` is runtime-only (not serialisable); codegen reconstructs validators from the schema export name.
- **FR-014**: System MUST support a global `optimization: { level: 1 | 2 | 3 }` setting in z2f.config.ts (type `OptimizationConfig`), read by both runtime and codegen. The config init template includes a commented-out example.
- **FR-015**: System MUST default to the current zodResolver behavior when optimization is not configured (backward compatible).
- **FR-016**: System MUST build schemaLite as `z.object({...fallthroughFields}).loose()` with top-level effect checks chained via Zod v4's `.check()` public API and transforms via `.transform()`. For non-decomposable pipes, the original schema is used.
- **FR-017**: System MUST guarantee strict validation equivalence — optimized validation MUST produce identical accept/reject decisions to zodResolver. Exclusive number bounds (`bag.exclusiveMinimum`/`bag.exclusiveMaximum`) MUST fall back to atomic Zod. Unknown check types MUST fall back to atomic Zod.
- **FR-018**: In codegen mode, the system MUST generate a separate `.lite.ts` file that constructs the lite schema by extracting top-level effect checks from the imported schema and replaying them onto `z.object({...fallthroughFields}).loose()` using `pick()` from the parent schema. The generated form component MUST import and use the lite schema for submit-time validation. For non-decomposable pipes, the `.lite.ts` file MUST re-export the original schema. `WalkResult` carries `SchemaLiteInfo` metadata so codegen knows which case to emit.

### Key Entities

- **FormOptimizer**: `(schema, ctx, field, params) => void` — visits a schema node after the processor and optimizes the field's validation strategy. Chained per type in level order (L1 → L2).
- **FormOptimizerContext**: `{ optimizers, schemaLite: SchemaLiteCollector, level: 1 | 2 | 3 }` — context passed to optimizers.
- **SchemaLiteCollector**: Accumulates effects via `addCheck(check)`, `addTransform(fn)`, `addField(path, schema)`, and `setOriginalSchema(schema)`. Builds the lite schema via `build()` or returns null when empty.
- **SchemaLiteInfo**: Codegen metadata carried on `WalkResult` — describes which reconstruction case to emit: `{ type: 'checks' }`, `{ type: 'transform' }`, `{ type: 'original' }`, or `null`.
- **FormField.validation**: `ValidationStrategy` with `mode: 'zodSchema' | 'native' | 'component-enforced'` and optional `rules?: NativeRules`. Watch mode (`'watch'`) is deferred to L3.
- **FormField.zodSchema**: `$ZodType | undefined` — runtime-only per-field schema reference set by L1. Not serialisable; codegen reconstructs from the schema export name.
- **OptimizationConfig**: `{ level?: 1 | 2 | 3 }` — global config in `z2f.config.ts` defaults block.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Per-keystroke validation at Level 1 validates only the changed field, not the full form — measurable as single-field validation instead of full-tree validation proportional to form field count.
- **SC-002**: At Level 2, forms with only simple constraints (no refines/transforms) produce zero Zod calls during user interaction — all validation is handled natively.
- **SC-003**: At Level 2 in codegen mode, forms with only simple constraints produce output files with no Zod runtime dependency (type-only import for `FormData` remains).
- **SC-004**: *(DEFERRED — L3)* At Level 3, cross-field validation errors appear immediately as the user types in the dependent field, without requiring form submission.
- **SC-005**: All existing forms continue to work identically when optimization is not enabled — zero regressions in default behavior.
- **SC-006**: Custom optimizers can be registered and take effect without modifying library source code, following the same pattern as custom processors. Custom optimizers replace the entire builtin chain for a type.
- **SC-007**: SchemaLite is discarded (not emitted) in 100% of cases where no top-level effects exist and all fields were successfully inlined.

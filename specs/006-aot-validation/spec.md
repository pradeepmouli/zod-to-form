# Feature Specification: AOT Validation Optimization

**Feature Branch**: `006-aot-validation`
**Created**: 2026-03-26
**Status**: Draft
**Input**: Progressive decomposition of composed Zod schemas into per-field validation, eliminating zodResolver overhead through three optimization levels (decompose tree, native rules, cross-field UX).

## Clarifications

### Session 2026-03-26

- Q: Must optimized validation produce semantically identical accept/reject results to zodResolver for all inputs? → A: Strict equivalence — optimized must match zodResolver accept/reject for all inputs; if a native rule can't perfectly replicate a Zod validator, fall back to atomic Zod.
- Q: How is runtime optimization configured — global, per-form, or both? → A: Global only — single optimization level configured in z2f.config.ts, read by both runtime and codegen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Per-Field Validation Decomposition (Priority: P1)

As a developer using zod-to-form (runtime or codegen), I want the library to decompose my composed Zod schema into isolated per-field validators so that each keystroke only validates the changed field — not the entire form tree.

**Why this priority**: This is the foundational optimization. Every subsequent level builds on the decomposed per-field validation structure. Without this, zodResolver re-validates all fields on every change, which is the primary performance bottleneck for large forms.

**Independent Test**: Can be fully tested by generating a form from a multi-field Zod schema and verifying that (a) no zodResolver is used, (b) each field validates independently via `register({ validate })`, and (c) top-level refines/transforms are captured in a schemaLite and run only on submit.

**Acceptance Scenarios**:

1. **Given** a Zod object schema with 5+ fields and no top-level refines, **When** the form is generated (runtime or codegen), **Then** each field has an isolated validator using `register({ validate })` and no zodResolver or schemaLite is present.
2. **Given** a Zod object schema with a top-level `superRefine`, **When** the form is generated, **Then** per-field validators are emitted for individual fields AND a schemaLite containing only the superRefine is emitted with a submit-time `safeParse` handler.
3. **Given** a field that cannot be safely inlined (safety net), **When** the optimizer encounters it, **Then** the field's schema is added to schemaLite rather than silently dropping validation.
4. **Given** a generated form, **When** a user types in one field, **Then** only that field's validator runs — not the validators for other fields.

---

### User Story 2 - Native RHF Rule Replacement (Priority: P2)

As a developer, I want simple Zod constraints (min, max, pattern, required) to be replaced with native React Hook Form rules so that most fields validate without calling Zod at runtime, and in codegen mode the `zod` import can be dropped entirely when no refines remain.

**Why this priority**: After decomposition, most fields still call `safeParse` on every keystroke. Replacing these with native RHF rules eliminates Zod execution for the majority of fields, and in codegen enables tree-shaking the `zod` dependency entirely for simple forms.

**Independent Test**: Can be tested by generating a form from a schema with only simple constraints (min/max/email/required) and verifying that (a) no hoisted Zod validators exist, (b) `register()` uses native RHF rules with correct values and error messages, and (c) in codegen, no `zod` import is present.

**Acceptance Scenarios**:

1. **Given** a field with `z.string().min(2).max(100)`, **When** Level 2 optimization is enabled, **Then** the field registers with `{ minLength: { value: 2, message }, maxLength: { value: 100, message } }` and no hoisted Zod validator exists for it.
2. **Given** a field with `z.string().email()`, **When** Level 2 optimization is enabled, **Then** the field registers with a `pattern` rule containing the email regex and error message extracted from the Zod schema.
3. **Given** a field with `z.string().min(2).refine(customFn)`, **When** Level 2 optimization is enabled, **Then** the entire chain is kept as a hoisted atomic Zod validator (no partial conversion).
4. **Given** a form where all fields convert to native rules and no schemaLite exists, **When** codegen runs at Level 2, **Then** the generated file contains no `zod` import.
5. **Given** a `z.enum([...])` field rendered as a Select component, **When** Level 2 optimization is enabled, **Then** no validation is emitted for that field (component enforcement).

---

### User Story 3 - Cross-Field Real-Time UX (Priority: P3)

As a developer, I want analyzable cross-field superRefines (e.g., password confirmation) to provide real-time validation feedback as the user types, instead of only surfacing errors on form submission.

**Why this priority**: This is primarily a UX improvement. Submit-time validation already works correctly after Levels 1-2. This level converts common patterns (password match, date range comparisons) into `watch()` + `validate` for instant feedback.

**Independent Test**: Can be tested by creating a schema with a `confirmPassword` superRefine referencing `password`, generating the form at Level 3, and verifying that typing in the confirm field immediately shows/clears the mismatch error without submitting.

**Acceptance Scenarios**:

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
2. **Given** no custom optimizer is registered for a type, **When** that type is processed, **Then** the default optimization chain (L1/L2/L3) applies normally.

---

### Edge Cases

- What happens when a field has both simple constraints AND a refine? The entire chain is kept as one hoisted atomic Zod validator — no partial native rule extraction.
- What happens when schemaLite has nested object structure? Container structure is preserved with `.loose()` only if any descendant has un-inlined validation; empty subtrees are pruned.
- What happens when a `transform()` exists on a field? It stays as a hoisted atomic Zod validator because the output type may differ from input.
- What happens when the optimization level is set higher than what's needed (e.g., Level 3 but no cross-field dependencies)? Each level is a no-op when nothing matches — no errors, no unnecessary output.
- What happens when a field uses `z.pipe()` chains? Pipes containing transforms stay as atomic Zod; pure refinement pipes may be decomposable at Level 2.
- What happens when optimization is disabled? The system falls back to the current zodResolver behavior with zero changes to output.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST decompose a composed Zod object schema into isolated per-field validators during the schema walk (Level 1).
- **FR-002**: System MUST collect top-level refines, transforms, and superRefines into a schemaLite collector that runs on submit.
- **FR-003**: System MUST discard schemaLite when it contains no validations (no top-level refines, no fallthrough fields).
- **FR-004**: System MUST hoist per-field Zod schemas to avoid per-keystroke allocation (created once, reused across validations).
- **FR-005**: System MUST replace simple Zod constraints with native RHF rules when Level 2 is enabled, preserving error messages from the Zod schema's error map.
- **FR-006**: System MUST keep the entire Zod chain as a hoisted atomic validator when a field has both simple constraints and a refine/transform.
- **FR-007**: System MUST recognize component-enforced validation (enum/Select, boolean/Checkbox, literal) and emit no validation for those fields at Level 2.
- **FR-008**: System MUST conditionally include the `zod` import in codegen output — only when at least one hoisted validator or schemaLite exists.
- **FR-009**: System MUST convert statically analyzable cross-field superRefines to real-time watch/validate patterns when Level 3 is enabled.
- **FR-010**: System MUST leave opaque/dynamic superRefines in schemaLite when they cannot be statically analyzed.
- **FR-011**: System MUST support an optimizer registry parallel to the existing processor registry, with chained (1:N) optimizers per schema type.
- **FR-012**: System MUST support custom optimizer registration following the same extensibility pattern as custom processors.
- **FR-013**: System MUST add validation strategy properties to the FormField intermediate representation.
- **FR-014**: System MUST support a global optimization setting in z2f.config.ts (read by both runtime and codegen) to enable optimization and control depth (three levels).
- **FR-015**: System MUST default to the current zodResolver behavior when optimization is not enabled (backward compatible).
- **FR-016**: System MUST preserve schemaLite container structure with `.loose()` when nested validation remains, pruning empty subtrees.
- **FR-017**: System MUST guarantee strict validation equivalence — optimized validation (at any level) MUST produce identical accept/reject decisions to zodResolver for all inputs. If a native rule cannot perfectly replicate a Zod validator's behavior, the system MUST fall back to atomic Zod for that field.

### Key Entities

- **FormOptimizer**: A function that visits a schema node after the processor and optimizes the field's validation strategy. Chained per type in level order.
- **FormOptimizerContext**: Context passed to optimizers containing the optimizer registry, schemaLite collector, and current optimization level.
- **SchemaLiteCollector**: Accumulates top-level refines/transforms and fallthrough fields during the walk. Builds the final schemaLite or returns null if empty.
- **FormField.validation**: New IR property describing the validation strategy (zodSchema, native, component-enforced, watch) with associated rules, watch targets, and validate expressions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Per-keystroke validation at Level 1 validates only the changed field, not the full form — measurable as single-field validation instead of full-tree validation proportional to form field count.
- **SC-002**: At Level 2, forms with only simple constraints (no refines/transforms) produce zero Zod calls during user interaction — all validation is handled natively.
- **SC-003**: At Level 2 in codegen mode, forms with only simple constraints produce output files with no Zod dependency.
- **SC-004**: At Level 3, cross-field validation errors (e.g., password mismatch) appear immediately as the user types in the dependent field, without requiring form submission.
- **SC-005**: All existing forms continue to work identically when optimization is not enabled — zero regressions in default behavior.
- **SC-006**: Custom optimizers can be registered and take effect without modifying library source code, following the same pattern as custom processors.
- **SC-007**: SchemaLite is discarded (not emitted) in 100% of cases where no top-level refines/transforms exist and all fields were successfully inlined.

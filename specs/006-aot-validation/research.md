# Research: Validation Optimization

**Feature**: 006-aot-validation | **Date**: 2026-03-26

## Research Topics

### 1. Extracting Zod's Internal Regex for Format Validators

**Decision**: Extract regex from `schema._zod.bag` at walk time for email/uuid/url formats.

**Rationale**: Zod v4 stores format validation regexes in the bag as pattern entries. The string processor already reads `schema._zod.bag` for constraints (see `packages/core/src/processors/string.ts`). For L2 strict equivalence, we extract the *exact same regex* Zod uses internally — no hand-rolled patterns. This guarantees FR-017 (identical accept/reject).

**Alternatives considered**:
- Hand-code well-known regexes (EMAIL_RE, UUID_RE) → Rejected: divergence risk if Zod updates internal regex
- Use Zod's `safeParse` as fallback for all format validators → Rejected: defeats L2 purpose (eliminate Zod calls)
- Use `type="email"` HTML validation → Rejected: browser-dependent, not equivalent to Zod

### 2. Walker Return Type Change for SchemaLite

**Decision**: Overload `walkSchema` return type based on options. When `options.validation` is set, return `WalkResult` containing both `fields` and `schemaLite`. When not set, return `FormField[]` as today.

**Rationale**: Backward compatibility requires the current `FormField[]` return type for all existing callers. The `WalkResult` type wraps the same data with an additional `schemaLite` property. TypeScript overloads handle the distinction at compile time.

**Alternatives considered**:
- Always return `WalkResult` → Rejected: breaking change for all existing callers
- Return schemaLite as a side effect on context → Rejected: impure, harder to test
- Attach schemaLite to a special FormField entry → Rejected: pollutes the IR

### 3. Optimizer Chain Ordering

**Decision**: Optimizers run in level order (L1 → L2 → L3) as a flat chain per field. Each optimizer reads what the previous produced and refines further.

**Rationale**: Levels are cumulative. L2 needs L1's `zodSchema` to know what to convert. L3 needs L2's analysis to know what's left. Running them as a chain (not separate passes) means single traversal.

**Alternatives considered**:
- Separate passes (walk 3 times) → Rejected: unnecessary overhead, processor results needed once
- Single monolithic optimizer → Rejected: not extensible, can't enable levels independently
- Reverse order (L3 first) → Rejected: L3 depends on L1/L2 output

### 4. Error Message Extraction from Zod v4

**Decision**: Extract error messages from `schema._zod.bag` check entries at walk time. Each Zod constraint (min, max, etc.) stores its error message in the bag alongside the constraint value.

**Rationale**: Zod v4's bag is the single source of truth for constraints AND their error messages. The string processor already reads bag entries for constraints. Extending this to extract error messages is mechanical — read `check.message` alongside `check.value`.

**Alternatives considered**:
- Run `safeParse` with invalid input to capture error messages → Rejected: impure, slow, fragile
- Require users to re-specify error messages in config → Rejected: duplication, drift risk
- Use default RHF error messages → Rejected: violates FR-005 (preserve Zod error messages)

### 5. SchemaLite Construction

**Decision**: Build schemaLite using `z.object({}).loose()` with top-level refines/transforms chained onto it. Fields that fall through are added to the object shape.

**Rationale**: `.loose()` allows unknown keys to pass through — critical because schemaLite validates a subset of the form data. Without `.loose()`, fields validated per-field would fail schemaLite's object validation. Top-level refines/transforms are preserved by chaining onto the loose object.

**Alternatives considered**:
- Use `z.any()` as base → Rejected: loses object-level refine semantics
- Reconstruct full schema minus inlined fields → Rejected: complex, error-prone
- Skip schemaLite entirely, run full schema on submit → Rejected: defeats Level 1 purpose

### 6. Controlled Components and Optimization

**Decision**: Controlled components (those with `controlled: true` in component config) use `useController()` instead of `register()`. For optimized validation, the `validate` function is passed via `useController({ rules: { validate } })` instead of `register({ validate })`.

**Rationale**: RHF's `useController` accepts the same `rules` object as `register()`. Native RHF rules (`required`, `min`, `max`, `minLength`, `maxLength`, `pattern`) and custom `validate` functions all work through `useController({ rules })`. No special handling needed — same optimization logic applies.

**Alternatives considered**:
- Skip optimization for controlled components → Rejected: unnecessarily limits optimization scope
- Convert controlled to uncontrolled when optimized → Rejected: changes component behavior

## No Unresolved Items

All technical context was resolvable from the existing codebase and Zod v4 internals. No external research or spike work needed.

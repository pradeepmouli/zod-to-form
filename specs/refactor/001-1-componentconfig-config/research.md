# Research: Unified ZodFormsConfig Refactoring

**Branch**: `refactor/001-1-componentconfig-config` | **Date**: 2026-03-04

## Summary

No external unknowns — this is an internal refactoring of existing types. Research confirms patterns and validates approach decisions.

## Decision 1: Type Hierarchy — FieldConfig / FormMeta Relationship

**Decision**: `FieldConfig = Omit<FormMeta, 'render'>`, then `FormMeta extends FieldConfig` adding `render`

**Rationale**: Config files must be serializable (JSON/.ts literals). The `render` callback is runtime-only and cannot appear in `z2f.config.ts`. Making `FieldConfig` the serializable base and `FormMeta` the runtime extension keeps the shared properties aligned while enforcing the boundary.

**Alternatives considered**:
- `FieldConfig = FormMeta` (identical types) — rejected because it would allow `render` in config files, which is meaningless for codegen
- Completely separate types — rejected because it recreates the current misalignment problem

## Decision 2: Config Precedence Order

**Decision**: CLI flag > `schemas.X.[prop]` > `defaults.[prop]` (most-specific wins)

**Rationale**: Standard "most specific wins" pattern used by CSS, tsconfig, ESLint. CLI flags as highest priority allows one-off overrides without modifying config files.

**Alternatives considered**:
- Config-file always wins — rejected because it prevents one-off overrides
- No per-schema overrides — rejected because it's the whole point of the `schemas` section

## Decision 3: Backward Compatibility Strategy

**Decision**: Accept old-style configs silently with no runtime warnings. `@deprecated` JSDoc only.

**Rationale**: This is a library consumed by developers. IDE strikethrough via JSDoc `@deprecated` is sufficient for migration signaling. Runtime `console.warn` adds noise in production and contradicts the "no warning" decision for top-level `fields`.

**Alternatives considered**:
- `console.warn` on first call — rejected for noise in production builds
- Hard break (reject old configs) — rejected for user disruption

## Decision 4: CLI Output Format

**Decision**: Styled list with labeled sections and indented items.

**Rationale**: Matches conventions from Vite, Next.js, shadcn-cli. Human-readable in terminals while providing enough detail.

**Alternatives considered**:
- Minimal one-per-line — rejected as too terse for discovery results
- Table format — rejected as overly verbose for typically small lists

## Decision 5: TSchemas Generic Inference Approach

**Decision**: Use `typeof import('./schema')` as the `TSchemas` type parameter. Default to `Record<string, unknown>` when not provided.

**Rationale**: TypeScript's `typeof import()` allows users to get type-safe schema name keys in the `schemas` config section without importing the schemas at runtime. The default fallback ensures the generic is optional.

**Validation**: Confirmed TypeScript supports `typeof import()` in type positions with `strict: true`. Example:
```ts
export default defineConfig<typeof import('@/components/ui'), typeof import('./schemas')>({
  schemas: {
    UserSchema: { name: 'UserForm', fields: { email: { fieldType: 'Input' } } }
  }
});
```

**Risk**: Some bundlers may not fully resolve `typeof import()` in `.d.ts` emit. Mitigation: the generic defaults to `Record<string, unknown>`, so it's always optional.

## Decision 6: Zod Validation Schema Update

**Decision**: Extend `componentConfigSchema` to accept both old and new config shapes. Add `defaults` and `schemas` as optional fields. Keep accepting `types`, `include`, `exclude` at top level.

**Rationale**: The validation schema must accept old configs without changes (backward compat) while also validating the new `defaults` and `schemas` sections.

**Implementation note**: The `fields` key is accepted both at top level (global defaults) and nested under `schemas.X.fields`. The validator does not need to check for conflicts — precedence is handled at resolution time.

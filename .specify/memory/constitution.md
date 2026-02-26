<!--
  Sync Impact Report
  ==================
  Version change: 1.0.0 → 1.0.1
  Bump rationale: PATCH — clarification of Principle I wording to resolve
    apparent contradiction with Principle III (FormField[] IR).

  Modified Principles:
    - I. Zod-Native Architecture: Clarified that the prohibition on
      intermediate representations applies to *schema*-level conversions
      (e.g., JSON Schema), not the output-level FormField[] IR mandated
      by Principle III.

  Added Sections: None
  Removed Sections: None

  Templates requiring updates: None — no structural changes.

  Follow-up TODOs: None.
-->

# zodforms Constitution

## Core Principles

### I. Zod-Native Architecture

All schema introspection MUST use Zod v4's native internals as the single
source of truth:

- Access structural data exclusively via `schema._zod.def`
- Access constraints exclusively via `schema._zod.bag`
- Navigate wrapper chains via `schema._zod.parent`
- Detect optionality via `schema._zod.optin` / `schema._zod.optout`
- Read metadata via `z.globalRegistry` (`.meta()`, `.describe()`)
- Store form-specific annotations via `z.registry<FormMeta>()`
- No intermediate *schema* representations (e.g., JSON Schema,
  ParsedSchema) or parallel type systems are permitted between Zod
  internals and processors. The output-level `FormField[]` IR
  (Principle III) is not a schema representation — it is the
  processor output consumed by renderers and codegen.

**Rationale**: Zod v4 was explicitly designed as a "validation substrate"
for library authors. Using its internals directly eliminates round-trip
information loss and keeps zodforms forward-compatible with Zod core.

### II. Processor Registry Pattern

The core walker MUST mirror the architecture of Zod v4's `toJSONSchema()`:

- A `process(schema, ctx, params)` function dispatches to processors
  by `def.type`
- Processors are registered in a `Record<string, FormProcessor>` map
- Each processor reads Zod internals and writes to a `FormField` descriptor
- Adding support for a new Zod type MUST require only adding a new
  processor — no walker modifications
- Custom processors MUST be registrable by library consumers

**Rationale**: This pattern is battle-tested in Zod core, enables
extensibility without forking, and ensures feature additions are isolated
and independently testable.

### III. Dual-Mode Output

The core walker MUST produce a `FormField[]` intermediate representation
that is consumed by two independent output modes:

- **Runtime renderer** (`zodform/react`): `FormField[]` → React elements
  at runtime via a pluggable `ComponentMap`
- **Build-time codegen** (`zodform/cli`): `FormField[]` → static `.tsx`
  source code with no runtime dependency on zodforms

Both modes MUST share the same core traversal and processor registry.
The same schema MUST produce identical form behavior regardless of mode.

**Rationale**: Runtime rendering enables rapid prototyping; build-time
codegen enables full control and zero-dependency output. Sharing the
core ensures consistency.

### IV. Zero Unnecessary Dependencies

Dependency discipline MUST be maintained across all packages:

- `zodform/core` MUST have zero dependencies beyond `zod` as a peer
- `zodform/react` MUST use only peer dependencies (`react`,
  `react-hook-form`, `@hookform/resolvers`, `zod`, UI components)
- `zodform/cli` MAY have direct dependencies for build tooling (`jiti`,
  `commander`, `prettier`, `chokidar`)
- Generated `.tsx` files MUST have zero runtime dependency on zodforms —
  they import only from `react-hook-form`, `zod`, and the user's UI library
- No dependency MUST be added without explicit justification

**Rationale**: Minimal dependencies reduce supply-chain risk, bundle size,
and version conflict surface. Generated code that stands alone is
fundamentally more maintainable.

### V. Test-First Development (NON-NEGOTIABLE)

All feature development MUST follow the TDD red-green-refactor cycle:

- Tests MUST be written before implementation code
- Tests MUST fail (red) before implementation begins
- Implementation MUST make tests pass (green) with minimal code
- Refactoring MUST NOT change test outcomes
- Every form processor MUST have dedicated tests covering:
  constraint extraction, metadata resolution, and edge cases
- Generated code MUST compile without errors (`tsc --noEmit`)
- Runtime and codegen output MUST be tested for behavioral equivalence

**Rationale**: The processor registry pattern creates many small,
independent units that are ideal for TDD. Skipping tests risks
silent regressions across 20+ Zod type handlers.

### VI. Type Safety First

Full TypeScript strict mode MUST be enabled across all packages:

- `z.infer<typeof schema>` types MUST propagate through form state
  to `onSubmit` handlers
- Generated code MUST pass `tsc --noEmit` with zero errors
- Public APIs MUST use generics to preserve schema type information
- `any` and `as` casts are prohibited unless explicitly justified
  with an inline comment explaining why

**Rationale**: zodforms targets TypeScript-first Zod users. Type safety
from schema definition through form submission is a core value
proposition over loosely-typed alternatives.

### VII. Accessibility by Default

All rendered and generated form components MUST include:

- `<label>` elements with `htmlFor` linking for every visible field
- Error messages displayed via `<FormMessage>` or equivalent
- `<FormDescription>` when description metadata is present
- `aria-invalid` on inputs when validation errors exist
- Proper `required` attributes derived from schema optionality
- Logical tab order (schema declaration order, overridable via
  `order` in form registry)
- Keyboard-navigable controls for all interactive elements

**Rationale**: Accessibility is not a feature to be added later.
Forms are a primary interaction point; inaccessible forms exclude
users and violate WCAG guidelines.

## Technology Stack

The following technology choices are mandatory for zodforms:

- **Language**: TypeScript 5.x with strict mode
- **Schema Library**: Zod v4 (v4.0.0+) — the `_zod` internals API
- **Form State**: React Hook Form 7+ with `zodResolver`
- **Default UI**: shadcn/ui form components (pluggable via ComponentMap)
- **Runtime**: React 18+
- **Build Tool**: Vite for development, TypeScript compiler for output
- **Testing**: Vitest for unit/integration tests
- **Package Manager**: pnpm with workspaces
- **Linting**: oxlint
- **Formatting**: oxfmt
- **Monorepo**: pnpm workspaces (packages/core, packages/react, packages/cli)

Additions to the stack MUST be justified against Principle IV
(Zero Unnecessary Dependencies).

## Development Workflow

All contributions MUST follow this workflow:

1. **Specification**: Features start with a spec-kit specification
   defining user stories and acceptance criteria
2. **Constitution Check**: Verify alignment with all seven principles
   before implementation begins
3. **Test-First**: Write failing tests for the feature (Principle V)
4. **Implementation**: Write minimal code to pass tests
5. **Type Check**: Run `pnpm run type-check` — zero errors required
6. **Lint**: Run `pnpm run lint` — zero warnings required
7. **Format**: Run `pnpm run format` — consistent formatting required
8. **Accessibility Audit**: Verify rendered output meets Principle VII
9. **Commit**: Follow conventional commit format

Quality gates that MUST pass before merge:

- All tests pass (`pnpm test`)
- Type checking passes (`pnpm run type-check`)
- Linting passes (`pnpm run lint`)
- Generated code compiles (`tsc --noEmit` on output)
- No new dependencies without justification (Principle IV)

## Governance

This constitution supersedes all other development practices for the
zodforms project. All pull requests and code reviews MUST verify
compliance with the seven core principles.

- **Amendments**: Require documented rationale, review, and a migration
  plan for any affected code or workflows
- **Versioning**: Constitution follows semantic versioning (MAJOR for
  principle removals/redefinitions, MINOR for additions, PATCH for
  clarifications)
- **Complexity Justification**: Any deviation from principles MUST be
  documented in the relevant spec's Complexity Tracking section
- **Guidance**: Use `AGENTS.md` for agent-specific development guidance

**Version**: 1.0.1 | **Ratified**: 2026-02-26 | **Last Amended**: 2026-02-26

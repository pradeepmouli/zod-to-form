# Enhancement: Publish as shadcn Registry Item with CLI Bootstrapper

**Enhancement ID**: enhance-003
**Branch**: `enhance/003-publish-zod-form`
**Created**: 2026-03-06
**Priority**: [ ] High | [x] Medium | [ ] Low
**Component**: `packages/react/`, `packages/cli/`, project root
**Status**: [x] Planned | [ ] In Progress | [ ] Complete

## Input
User description: "Publish @zod-to-form/react as a shadcn registry item and add a CLI bootstrapper for shadcn add integration"

## Clarifications

### Session 2026-03-06
- Q: Where will the registry.json be hosted/served from? → A: GitHub repo raw URL
- Q: Should the `zod-form` registry item inline full source or be a thin wrapper with npm dep? → A: Thin wrapper — imports from `@zod-to-form/react`, wires shadcn components
- Q: What are the exact shadcn component names for the form field wrappers? → A: `Field / FieldLabel / FieldDescription / FieldMessage` (not `FieldError`)
- Q: Should both approaches ship together or one first? → A: Both together — shared prerequisite migration and registry.json

## Overview
Create a `registry.json` so `@zod-to-form/react` can be installed via `npx shadcn add @zod-to-form/zod-form`. Two approaches ship together: (1) a runtime `<ZodForm>` thin-wrapper registry item that imports from `@zod-to-form/react` and wires shadcn components, and (2) a bootstrapper registry item that drops a pre-configured `z2f.config.ts` for the CLI codegen pipeline. Both require migrating form wrapper names from deprecated `FormField/FormLabel/FormDescription/FormMessage` to the current `Field/FieldLabel/FieldDescription/FieldMessage` pattern. The `FormControl` wrapper (used by `formPrimitives.control` in codegen) has no `<Field>` equivalent in shadcn — it is kept as-is but not renamed. Registry hosted from GitHub repo raw URL.

## Motivation
shadcn/ui is the dominant component library for Next.js/React projects. Publishing as registry items lets users install with a single `npx shadcn add` command. The `<Form>` component family has been deprecated in favor of `<Field>` components — aligning with this is necessary before publishing. Approach 1 gives users the runtime renderer immediately; Approach 2 enables build-time codegen for users who prefer generated standalone components.

## Proposed Changes

### Approach 1: Runtime Registry Item (`zod-form`)
- Create `registry.json` with a `registry:component` item for `ZodForm`
- Create `registry/zod-form.tsx` source that re-exports the runtime renderer
- Declare `registryDependencies` on shadcn primitives (`field`, `input`, `select`, `checkbox`, `textarea`, `switch`)
- Declare `dependencies` on `react-hook-form`, `@hookform/resolvers`, `zod`, `@zod-to-form/core`

### Approach 2: CLI Bootstrapper Registry Item (`zod-form-cli`)
- Create a `registry:file` item that installs `z2f.config.ts` pre-configured for shadcn (with `target: "~/z2f.config.ts"`)
- The config uses `Field/FieldLabel/FieldDescription/FieldMessage` primitives and `SHADCN_FIELD_TYPES`
- Declare `devDependencies` on `@zod-to-form/cli`
- Include a package.json script entry for `zod-to-form generate`

### Prerequisite: Migrate to `<Field>` Pattern
- Rename wrapper component keys in `defaultComponentMap` and `shadcnComponentMap`
- Update `FieldRenderer.tsx` to reference new wrapper keys
- Update `init.ts` autodiscovery to detect `Field/FieldLabel` exports
- Update codegen `formPrimitives` defaults

**Files to Modify**:
- `packages/react/src/components/index.ts` — rename default wrapper keys (`FormField` → `Field`, etc.)
- `packages/react/src/shadcn/index.ts` — rename shadcn wrapper components
- `packages/react/src/FieldRenderer.tsx` — update wrapper component key references
- `packages/cli/src/init.ts` — update autodiscovery patterns
- `packages/cli/src/codegen.ts` / `templates.ts` — update default `formPrimitives` names

**Files to Create**:
- `registry.json` — shadcn registry manifest (project root)
- `registry/zod-form.tsx` — registry source for runtime component
- `registry/zod-form-cli.ts` — bootstrapper config file

**Breaking Changes**: [x] Yes | [ ] No
The `shadcnComponentMap` and `defaultComponentMap` keys change from `FormField/FormLabel/FormDescription/FormMessage` to `Field/FieldLabel/FieldDescription/FieldMessage`. Old keys are removed (no deprecated aliases — backward compatibility not needed).

## Implementation Plan

**Phase 1: Implementation**

**Tasks**:
1. [ ] Rename wrapper component keys in `defaultComponentMap` and `shadcnComponentMap` from `FormField/FormLabel/FormDescription/FormMessage` to `Field/FieldLabel/FieldDescription/FieldMessage`. Remove old keys (no backward compat needed). Update `FieldRenderer.tsx` to reference new keys.
2. [ ] Update `init.ts` autodiscovery to detect `Field/FieldLabel/FieldDescription/FieldMessage` exports alongside legacy `FormField/FormLabel` patterns.
3. [ ] Update codegen `formPrimitives` defaults in `packages/cli/src/templates.ts` to use `Field/FieldLabel` naming.
4. [ ] Create `registry.json` at project root with two items: `zod-form` (`registry:component`) and `zod-form-cli` (`registry:file`), following shadcn registry schema.
5. [ ] Create `registry/zod-form.tsx` — exports `ZodForm` with `shadcnComponentMap` wired in and shadcn `registryDependencies`.
6. [ ] Create `registry/zod-form-cli.ts` — bootstrapper `z2f.config.ts` pre-configured for shadcn with `@zod-to-form/cli` as devDependency.
7. [ ] Update all tests to use new wrapper component key names.

**Acceptance Criteria**:
- [ ] `shadcnComponentMap` uses `Field/FieldLabel/FieldDescription/FieldMessage` keys
- [ ] Old `FormField/FormLabel` keys are removed — clean break, no deprecated aliases
- [ ] `registry.json` is valid and contains both `zod-form` and `zod-form-cli` items
- [ ] `pnpm test`, `pnpm run type-check`, `pnpm run build` all pass
- [ ] `init` command detects both new and legacy component export patterns
- [ ] Codegen output uses `Field/FieldLabel` wrapper names by default

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Edge cases verified

## Verification Checklist
- [ ] Changes implemented as described
- [ ] Tests written and passing
- [ ] No regressions in existing functionality
- [ ] Documentation updated (if needed)
- [ ] Code reviewed (if appropriate)

## Notes
- shadcn 3.0 supports namespaced registries (`@namespace/item`) — consider `@zod-to-form/` namespace
- The `shadcnComponentMap` uses HTML stubs with Tailwind classes (no real shadcn imports) — intentional so the package works without shadcn installed
- The registry item copies source into the user's project (shadcn pattern); the bootstrapper installs the CLI as a devDependency
- `registry.json` schema: `{ "$schema": "https://ui.shadcn.com/schema/registry.json", "name": "zod-to-form", "homepage": "...", "items": [...] }`
- This enhancement may grow beyond 7 tasks during implementation — if so, consider promoting to a full `/speckit.specify` feature spec

---
*Enhancement created using `/enhance` workflow - See .specify/extensions/workflows/enhance/*

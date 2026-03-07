# Implementation Plan: shadcn Registry Item & CLI Bootstrapper

**Branch**: `enhance/003-publish-zod-form` | **Date**: 2026-03-06 | **Spec**: `enhancement.md`

## Summary

Publish `@zod-to-form/react` as a shadcn registry item via two complementary approaches: (1) a thin-wrapper `registry:component` that imports from the npm package and wires shadcn components, and (2) a `registry:file` bootstrapper that drops a pre-configured `z2f.config.ts` for the CLI codegen pipeline. Prerequisite: migrate internal wrapper component keys from `FormField/FormLabel/FormDescription/FormMessage` to `Field/FieldLabel/FieldDescription/FieldMessage` to match shadcn's current naming.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 18+, React Hook Form 7+, Zod v4, @hookform/resolvers, shadcn/ui (peer/optional)
**Storage**: N/A
**Testing**: Vitest
**Target Platform**: Node.js (CLI), Browser (React runtime)
**Project Type**: library + CLI tool
**Constraints**: Zero new runtime dependencies (Constitution Principle IV). Registry items consumable via `npx shadcn add <url>`.
**Scale/Scope**: 2 registry items, ~10 files modified, ~5 files created

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zod-Native Architecture | PASS | No schema handling changes |
| II. Processor Registry Pattern | PASS | No processor changes |
| III. Dual-Mode Output | PASS | Both modes preserved |
| IV. Zero Unnecessary Dependencies | PASS | No new deps to core/react/cli packages |
| V. Test-First Development | PASS | Tests updated for renamed keys |
| VI. Type Safety First | PASS | Strict mode maintained |
| VII. Accessibility by Default | PASS | Identical accessible markup |

## Project Structure

```text
packages/react/src/
├── components/index.ts        # Rename wrapper keys, remove old keys
├── shadcn/index.ts            # Rename shadcn wrapper components
├── FieldRenderer.tsx           # Update componentMap key references
└── ZodForm.tsx                 # No changes

packages/cli/src/
├── init.ts                     # Update autodiscovery patterns
├── codegen.ts                  # Update formPrimitives references
└── templates.ts                # No structural changes

public/r/                       # NEW: served registry JSON
├── zod-form.json
└── zod-form-cli.json

registry/                       # NEW: registry source files
├── zod-form.tsx
└── zod-form-cli.ts
```

## Phase 1: Migrate to `<Field>` Pattern

**Goal**: Rename wrapper component keys to match shadcn's current naming.

| Old Key | New Key |
|---------|---------|
| `FormField` | `Field` |
| `FormLabel` | `FieldLabel` |
| `FormDescription` | `FieldDescription` |
| `FormMessage` | `FieldMessage` |

**Changes**:

1. **`packages/react/src/components/index.ts`**: Rename functions, update `defaultComponentMap` keys. Remove old keys entirely (no backward compat).

2. **`packages/react/src/shadcn/index.ts`**: Rename `ShadcnFormField` → `ShadcnField`, etc. Update `shadcnComponentMap` keys. Remove old keys entirely.

3. **`packages/react/src/FieldRenderer.tsx`**: Update all `componentMap.FormField` → `componentMap.Field`, `componentMap.FormLabel` → `componentMap.FieldLabel`, etc.

4. **`packages/cli/src/init.ts`**: Update `discoverFormPrimitives` to detect `Field`/`FieldLabel` exports. Replace old `FormField`/`FormLabel` detection patterns.

5. **`packages/cli/src/codegen.ts`**: Update default `formPrimitives` wrapper names in generated output.

## Phase 2: Create Registry Items

**Approach 1 — `zod-form` (runtime thin wrapper)**:
- Source: `registry/zod-form.tsx` re-exports `ZodForm` + `shadcnComponentMap` from `@zod-to-form/react`
- Served: `public/r/zod-form.json` with `content` field containing source
- Type: `registry:component`
- `dependencies`: `@zod-to-form/react`, `@zod-to-form/core`, `react-hook-form`, `@hookform/resolvers`, `zod`
- `registryDependencies`: `field`, `input`, `select`, `checkbox`, `textarea`, `switch`, `label`

**Approach 2 — `zod-form-cli` (bootstrapper)**:
- Source: `registry/zod-form-cli.ts` — pre-configured `z2f.config.ts` for shadcn
- Served: `public/r/zod-form-cli.json` with `content` field
- Type: `registry:file` with `target: "~/z2f.config.ts"`
- `devDependencies`: `@zod-to-form/cli`
- `registryDependencies`: `field`, `input`, `select`, `checkbox`, `textarea`, `switch`, `label`

**User consumption**:
```bash
# Runtime approach
npx shadcn add https://raw.githubusercontent.com/pradeepmouli/zod-to-form/master/public/r/zod-form.json

# Codegen approach
npx shadcn add https://raw.githubusercontent.com/pradeepmouli/zod-to-form/master/public/r/zod-form-cli.json
```

## Phase 3: Test & Verify

- Update `FieldRenderer.test.tsx` for new key names
- Verify old keys are removed (no deprecated aliases)
- Update `init.test.ts` expected primitive names
- Update `cli-e2e.test.ts` expected codegen output
- Run: `pnpm test`, `pnpm run type-check`, `pnpm run build`, `pnpm run lint`

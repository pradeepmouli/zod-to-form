# Tasks: shadcn Registry Item & CLI Bootstrapper

**Input**: Design documents from `/specs/enhance/003-publish-zod-form/`
**Prerequisites**: plan.md, spec.md (enhancement.md), research.md, quickstart.md

**Tests**: Tests are included — the constitution requires test-first development (Principle V), and the spec explicitly requires test updates.

**Organization**: Tasks grouped into 3 user stories: (US1) `<Field>` migration, (US2) runtime registry item, (US3) CLI bootstrapper. Phase 2 follows TDD: tests are written first (expecting new names → tests fail), then implementation makes them pass.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/react/`, `packages/cli/`, `packages/core/`
- **New directories**: `public/r/`, `registry/`

---

## Phase 1: Setup

**Purpose**: No setup needed — existing monorepo structure is sufficient. Create new directories only.

- [X] T001 Create `public/r/` directory at repository root for served registry JSON files
- [X] T002 Create `registry/` directory at repository root for registry source files

---

## Phase 2: Foundational — `<Field>` Migration (TDD: Tests First, Then Implementation)

**Purpose**: Migrate wrapper component keys from `FormField/FormLabel/FormDescription/FormMessage` to `Field/FieldLabel/FieldDescription/FieldMessage/FieldControl`, aligning with shadcn’s current `Field` primitives (including `FieldControl`). This MUST complete before registry items can reference the new names.

**CRITICAL**: No registry item work (US2, US3) can begin until this phase is complete.

### Step 1: Write Tests (RED — tests will fail against old key names)

- [X] T003 [P] [US1] Update `FieldRenderer.test.tsx` assertions in `packages/react/tests/FieldRenderer.test.tsx` to use new wrapper key names (`Field`, `FieldLabel`, `FieldDescription`, `FieldMessage`). Verify old keys (`FormField`, `FormLabel`, etc.) are NOT present in `defaultComponentMap`.
- [X] T004 [P] [US1] Update `init.test.ts` expected primitive names in `packages/cli/tests/init.test.ts` to match new `Field`/`FieldLabel`/`FieldDescription` autodiscovery output.
- [X] T005 [P] [US1] Update `cli-e2e.test.ts` expected codegen output in `packages/cli/tests/cli-e2e.test.ts` to use `Field`/`FieldLabel` wrapper names in generated `.tsx` files.

### Step 2: Implementation (GREEN — make tests pass)

- [X] T006 [P] Rename wrapper functions and export keys in `packages/react/src/components/index.ts`: `FormField` → `Field`, `FormLabel` → `FieldLabel`, `FormDescription` → `FieldDescription`, `FormMessage` → `FieldMessage`. Remove old keys entirely from `defaultComponentMap`.
- [X] T007 [P] Rename shadcn wrapper functions in `packages/react/src/shadcn/index.ts`: `ShadcnFormField` → `ShadcnField`, `ShadcnFormLabel` → `ShadcnFieldLabel`, `ShadcnFormDescription` → `ShadcnFieldDescription`, `ShadcnFormMessage` → `ShadcnFieldMessage`. Update `shadcnComponentMap` keys. Remove old keys entirely.
- [X] T008 Update `componentMap` key references in `packages/react/src/FieldRenderer.tsx`: `componentMap.FormField` → `componentMap.Field`, `componentMap.FormLabel` → `componentMap.FieldLabel`, `componentMap.FormDescription` → `componentMap.FieldDescription`, `componentMap.FormMessage` → `componentMap.FieldMessage`.
- [X] T009 [P] Update autodiscovery patterns in `packages/cli/src/init.ts`: replace `FormField`/`FormLabel` detection with `Field`/`FieldLabel`/`FieldDescription` as detection targets. Note: `formPrimitives.control` keeps its current name — no `FieldControl` equivalent exists in shadcn.
- [X] T010 [P] Update codegen default `formPrimitives` wrapper names in `packages/cli/src/codegen.ts` to use `Field`/`FieldLabel`/`FieldDescription`/`FieldMessage` in generated output. Keep `control` primitive unchanged.

### Step 3: Verify (REFACTOR)

- [X] T011 [US1] Run full verification suite: `pnpm test && pnpm run type-check && pnpm run build && pnpm run lint` — all must pass with zero errors/warnings.

**Checkpoint**: `<Field>` migration fully validated. TDD cycle complete. All existing behavior preserved. Ready for registry items.

---

## Phase 3: User Story 2 — Runtime Registry Item (`zod-form`) (Priority: P2)

**Goal**: Create the `zod-form` shadcn registry item so users can install `<ZodForm>` via `npx shadcn add <url>`.

**Independent Test**: `public/r/zod-form.json` is valid JSON with correct schema, `content` field contains the thin wrapper source, `dependencies` and `registryDependencies` are correct.

### Implementation for User Story 2

- [X] T012 [P] [US2] Create `registry/zod-form.tsx` — thin wrapper that re-exports `ZodForm` and `shadcnComponentMap` from `@zod-to-form/react`, with a default export wiring shadcn components.
- [X] T013 [US2] Create `public/r/zod-form.json` — served registry item JSON with `$schema`, `name: "zod-form"`, `type: "registry:component"`, `title`, `description`, `dependencies` (`@zod-to-form/react`, `@zod-to-form/core`, `react-hook-form`, `@hookform/resolvers`, `zod`), `registryDependencies` (`field`, `input`, `select`, `checkbox`, `textarea`, `switch`, `label`), and `files` array with `content` field populated from `registry/zod-form.tsx` source.

**Checkpoint**: `public/r/zod-form.json` is a valid, self-contained registry item JSON.

---

## Phase 4: User Story 3 — CLI Bootstrapper Registry Item (`zod-form-cli`) (Priority: P3)

**Goal**: Create the `zod-form-cli` shadcn registry item so users can bootstrap the codegen pipeline via `npx shadcn add <url>`.

**Independent Test**: `public/r/zod-form-cli.json` is valid JSON, drops a `z2f.config.ts` at project root, declares `@zod-to-form/cli` as devDependency.

### Implementation for User Story 3

- [X] T014 [P] [US3] Create `registry/zod-form-cli.ts` — pre-configured `z2f.config.ts` source using `defineConfig` from `@zod-to-form/core` with `Field`/`FieldLabel`/`FieldDescription`/`FieldMessage` formPrimitives (keeping `control` as-is), `SHADCN_FIELD_TYPES` fieldTypes, and sensible defaults (`mode: 'submit'`, `ui: 'shadcn'`).
- [X] T015 [US3] Create `public/r/zod-form-cli.json` — served registry item JSON with `$schema`, `name: "zod-form-cli"`, `type: "registry:file"`, `title`, `description`, `devDependencies` (`@zod-to-form/cli`), `registryDependencies` (`field`, `input`, `select`, `checkbox`, `textarea`, `switch`, `label`), `files` array with `target: "~/z2f.config.ts"` and `content` field populated from `registry/zod-form-cli.ts` source.

**Checkpoint**: `public/r/zod-form-cli.json` is a valid, self-contained registry item JSON.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all phases.

- [X] T016 Add automated registry JSON validation test in `packages/cli/tests/registry.test.ts`: parse both `public/r/zod-form.json` and `public/r/zod-form-cli.json`, assert they have valid `$schema`, `name`, `type`, `files[].content`, and expected `dependencies`/`registryDependencies`.
- [X] T017 Run full verification suite: `pnpm test && pnpm run type-check && pnpm run build && pnpm run lint` — all must pass
- [X] T018 Run quickstart.md validation scenarios manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — create directories
- **Foundational (Phase 2)**: TDD cycle — tests first (T003-T005), then implementation (T006-T010), then verify (T011). BLOCKS all user stories.
- **US2 (Phase 3)**: Depends on Phase 2 completion — registry item uses new component names
- **US3 (Phase 4)**: Depends on Phase 2 completion — bootstrapper config uses new component names
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Embedded in Phase 2 (TDD cycle) — must complete first
- **US2 (P2)**: Can start after Phase 2 completion
- **US3 (P3)**: Can start after Phase 2 completion (independent of US2)
- **US2 and US3 can run in parallel** — they create separate files with no overlap

### Parallel Opportunities

- T003, T004, T005 can run in parallel (different test files)
- T006, T007 can run in parallel (different files: `components/index.ts` vs `shadcn/index.ts`)
- T009, T010 can run in parallel (different files: `init.ts` vs `codegen.ts`)
- T012, T014 can run in parallel (different registry source files)
- US2 and US3 implementation can run in parallel (different served JSON files)

---

## Parallel Example: TDD Tests Phase

```bash
# Launch all test updates in parallel (RED phase):
Task T003: "Update FieldRenderer.test.tsx assertions for new key names"
Task T004: "Update init.test.ts expected names"
Task T005: "Update cli-e2e.test.ts expected output"
```

## Parallel Example: Implementation Phase

```bash
# Launch parallel wrapper renames (GREEN phase):
Task T006: "Rename wrapper keys in packages/react/src/components/index.ts"
Task T007: "Rename shadcn wrappers in packages/react/src/shadcn/index.ts"

# Launch parallel CLI updates:
Task T009: "Update autodiscovery in packages/cli/src/init.ts"
Task T010: "Update codegen in packages/cli/src/codegen.ts"
```

---

## Implementation Strategy

### MVP First (Phase 2 Only)

1. Complete Phase 1: Setup (create directories)
2. Complete Phase 2: TDD `<Field>` migration (tests → implement → verify)
3. **STOP and VALIDATE**: All tests pass, old keys removed
4. Ready to build registry items

### Incremental Delivery

1. Setup + Phase 2 → `<Field>` migration done (TDD complete)
2. US2 → Runtime registry item → Users can `npx shadcn add` ZodForm
3. US3 → CLI bootstrapper → Users can `npx shadcn add` codegen config
4. Polish → Final validation with automated registry JSON tests

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US2 and US3 are fully independent and can be implemented in parallel
- No backward compatibility — old keys (`FormField`, `FormLabel`, etc.) are removed entirely
- `formPrimitives.control` is kept as-is — shadcn's `<Field>` pattern has no `FieldControl` equivalent
- Registry JSON files must include `content` field with source code as string
- Commit after each phase completion

# Enhancement: Add CLI init command for component-config generation

**Enhancement ID**: [enhance-002]
**Branch**: `enhance/002-init-command-cli`
**Created**: 2026-03-02
**Priority**: [ ] High | [x] Medium | [ ] Low
**Component**: packages/cli (`init` command, config generation, shadcn config introspection)
**Status**: [x] Planned | [ ] In Progress | [ ] Complete

## Input
User description: "add init command to cli - automatically create component-config.ts (heretofore called z2f.config.ts) based on sensible defaults and introspection of (shadcn) config"

## Overview
Add an `init` command to `@zod-to-form/cli` that bootstraps `component-config.ts` for users. The command should infer sensible defaults and, when available, read shadcn configuration to prefill paths/options so generated forms align with the project’s existing UI setup.
The enhancement also centralizes shared component-config types/logic in core and improves CLI UX with explicit verbose progress, status, and end-of-run summary output.

## Motivation
Current setup requires manual authoring of `z2f.config.ts`, which is error-prone and slows initial adoption. A guided `init` command reduces setup friction, standardizes configuration under `component-config.ts`, and improves interoperability with projects already using shadcn conventions.
Consolidating shared types in core prevents duplicated type definitions across packages, and richer CLI status output makes setup and troubleshooting easier for users.

## Proposed Changes
[Describe what will be changed or added. Be specific but concise:]
- Add a new `init` command in the CLI entrypoint to create `component-config.ts` in the project root.
- Implement config discovery/introspection that reads shadcn config (when present) and maps key values into zod-to-form defaults.
- Rename generated/default config target from `z2f.config.ts` to `component-config.ts` while maintaining clear migration behavior.
- Add overwrite and dry-run safeguards (or equivalent confirmation flow) to prevent destructive writes.
- Move shared component-config logic/types (and related reusable contracts) from CLI-local implementations into `@zod-to-form/core`.
- Add verbose CLI progress output (step status + completion summary) to make `init` behavior transparent.
- Verify `tsconfig.json`/TS module-resolution assumptions so generated schema import paths use correct extensions and resolvable paths.
- Update CLI docs and examples to reference `init` and the new config filename.

**Files to Modify**:
- `packages/cli/src/index.ts` - register and wire `init` command options/handlers.
- `packages/cli/src/loader.ts` - support loading `component-config.ts` as primary config.
- `packages/cli/src/templates.ts` (or new helper) - emit `component-config.ts` content with inferred defaults.
- `packages/cli/src/codegen.ts` - ensure config resolution uses new filename path.
- `packages/core/src/types.ts` (and/or new core module) - host shared component-config types/contracts consumed by CLI/runtime.
- `packages/core/src/index.ts` - export shared component-config types/helpers for package consumers.
- `tsconfig.json` (and package-level tsconfig files as needed) - confirm module resolution and extension behavior for generated schema imports.
- `packages/cli/tests/*.test.ts` - unit/integration coverage for init behavior and config discovery.
- `packages/core/tests/*.test.ts` (if needed) - validate shared config-type/helper behavior in core.
- `packages/cli/README.md` and root docs - usage and migration notes.

**Breaking Changes**: [ ] Yes | [x] No
Existing `z2f.config.ts` projects should continue to work during transition via backward-compatible loading order; new scaffolding defaults to `component-config.ts`.

## Implementation Plan

**Phase 1: Implementation**

**Tasks**:
1. [ ] Add `init` command to CLI command tree with output path, force/overwrite, and dry-run options.
2. [ ] Implement config generator that creates `component-config.ts` using sensible defaults.
3. [ ] Add shadcn config discovery/introspection and map discovered values into generated config.
4. [ ] Move shared component-config types/logic into core and consume them from CLI.
5. [ ] Update config loader/resolution order to prefer `component-config.ts` while retaining fallback to `z2f.config.ts`.
6. [ ] Add verbose progress/status/summary output for `init` (including dry-run and overwrite flows).
7. [ ] Verify/update `tsconfig` settings and generator behavior so schema imports emit correct paths/extensions for the project module system.
8. [ ] Add/adjust CLI/core tests for init generation, fallback behavior, shared types, output expectations, and import path correctness.
9. [ ] Update documentation and examples to use `component-config.ts`, `init` usage, verbose output examples, and import-path guidance.

**Acceptance Criteria**:
- [ ] Running `zod-to-form init` creates a valid `component-config.ts` in an uninitialized project.
- [ ] When shadcn config exists, generated config reflects discovered aliases/paths with safe defaults for missing fields.
- [ ] Existing projects using `z2f.config.ts` continue working without immediate manual migration.
- [ ] `init` command respects overwrite safeguards and reports clear actionable output.
- [ ] Shared component-config types/logic are defined once in core and reused by CLI.
- [ ] Verbose mode (or default status output per spec) shows progress steps and a final summary of actions taken.
- [ ] Generated schema imports compile with repo TypeScript config expectations (correct extension/path behavior for current module resolution).
- [ ] Tests and lint pass for CLI package and changed workspace targets.

## Testing
- [ ] Unit tests added/updated (`init` handler, config mapping, loader precedence, shared core types/helpers, import path generation)
- [ ] Integration tests pass (fresh repo init flow, shadcn-present flow, legacy config fallback)
- [ ] Manual testing complete (`init`, `init --dry-run`, overwrite scenario, verbose summary output)
- [ ] Edge cases verified (missing shadcn config, partial config, conflicting existing file)

## Verification Checklist
- [ ] Changes implemented as described
- [ ] Tests written and passing
- [ ] No regressions in existing CLI functionality
- [ ] Documentation updated (CLI and migration guidance)
- [ ] Code reviewed (if appropriate)

## Notes
- Keep enhancement intentionally single-phase; if migration tooling or multi-step deprecation policy is required, promote to `/speckit.specify`.
- Favor deterministic generation output so tests can snapshot content.
- Align inferred defaults with existing runtime/codegen expectations to avoid hidden behavior changes.
- Keep CLI logging structured and concise so verbose mode is informative without becoming noisy.

---
*Enhancement created using `/enhance` workflow - See .specify/extensions/workflows/enhance/*

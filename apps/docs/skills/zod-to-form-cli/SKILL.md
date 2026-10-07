---
description: "@zod-to-form/cli — Build-time CLI for generating React form components from Zod v4 schemas.\n\nDrives the full code generation pipeline: loads a schema file, walks the Zod internal\ntype tree via `@zod-to-form/core`, applies per-field overrides from `z2f.config.ts`,\nand emits static `.tsx` form components — optionally alongside a Next.js server action\nand a schema-lite file for optimized client-side validation. Use when: You need programmatic codegen from a Node.js script or build tool (not just...."
name: zod-to-form-cli
---

# @zod-to-form/cli

@zod-to-form/cli — Build-time CLI for generating React form components from Zod v4 schemas.

Drives the full code generation pipeline: loads a schema file, walks the Zod internal
type tree via `@zod-to-form/core`, applies per-field overrides from `z2f.config.ts`,
and emits static `.tsx` form components — optionally alongside a Next.js server action
and a schema-lite file for optimized client-side validation.

Before using the CLI, decide: are you scripting (use `runGenerate`) or interacting
(use `npx zod-to-form`)? For config authoring, always use `defineConfig` for type inference.

## When to Use

**Use this skill when:**
- You need programmatic codegen from a Node.js script or build tool (not just the CLI) → use `runGenerate`
- You are writing tests for the code generation pipeline end-to-end → use `runGenerate`
- You need `dryRun` output for preview/diffing without touching the filesystem → use `runGenerate`
- Testing CLI commands programmatically without spawning a child process → use `createProgram`
- Extending the CLI with custom sub-commands in a wrapper tool → use `createProgram`

**Do NOT use when:**
- Interactive use — run `npx zod-to-form generate` (via `createProgram()`) instead (`runGenerate`)
- Browser environments — this function uses Node.js `fs` and `path` APIs (`runGenerate`)
- You just want to generate a form from a script — use `runGenerate()` directly (`createProgram`)
- End-user invocation — use `npx zod-to-form` (the binary entry point) instead (`createProgram`)

API surface: 4 functions, 1 types

## NEVER

- NEVER treat `result.code` as the on-disk file content when `overwrite` is false — if the output file already exists, `runGenerate` returns `wroteFile: false` and the existing file is unchanged without throwing; FIX: check `result.wroteFile` before assuming the file was updated, or set `defaults.overwrite: true` explicitly
- NEVER use `--watch` mode on schemas that re-export types from other modules — the watcher tracks only the top-level file, so a change in an imported schema file does not trigger regeneration; FIX: run `runGenerate` manually from a parent file watcher (e.g. chokidar) that covers the full import tree
- NEVER call `program.parse()` (synchronous) in ESM environments — Commander's synchronous parse returns before async action handlers complete in ESM because it cannot await top-level async actions; FIX: always use `.parseAsync(process.argv)`

## Configuration

2 configuration interfaces — see references/config.md for details.

## Quick Reference

**CLI:** `runGenerate` (Executes the code generation pipeline for a single Zod schema export), `createProgram` (Creates the Commander)
**Configuration:** `defineConfig` (Typed identity helper for canonical authored configuration), `validateConfig` (Validate canonical authored configuration without expanding presets)
**config.d:** `ComponentOverride` (Per-component metadata override)

## References

Load these on demand — do NOT read all at once:

- When calling any function → read `references/functions.md` for full signatures, parameters, and return types
- When defining typed variables or function parameters → read `references/types.md`
- When configuring options → read `references/config.md` for all settings and defaults

## Links

- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
---
name: zod-to-form-cli
description: "Build-time code generator for Zod v4 form components Use when working with zod, zod-v4, codegen, forms, form-generation, react-hook-form, schema-driven, cli, generator, component-codegen, schema-to-tsx."
license: MIT
---

# @zod-to-form/cli

Build-time code generator for Zod v4 form components

## When to Use

- Working with zod, zod-v4, codegen, forms, form-generation, react-hook-form, schema-driven, cli, generator, component-codegen, schema-to-tsx

| Task | Use | Why |
|------|-----|-----|
| You need programmatic codegen from a Node.js script or build tool (not just the CLI) | `runGenerate` | — |
| You are writing tests for the code generation pipeline end-to-end | `runGenerate` | — |
| You need `dryRun` output for preview/diffing without touching the filesystem | `runGenerate` | — |
| Testing CLI commands programmatically without spawning a child process | `createProgram` | — |
| Extending the CLI with custom sub-commands in a wrapper tool | `createProgram` | — |
| Writing z2f.config.ts for CLI codegen (primary use case) | `defineConfig` | — |
| You want TypeScript inference and IDE autocompletion for config | `defineConfig` | — |
| Loading config from JSON files or dynamic import() | `validateConfig` | — |
| You need runtime validation of user-provided config | `validateConfig` | — |

**Avoid when:**

| Don't Use | When | Use Instead |
|-----------|------|-------------|
| `runGenerate` | Interactive use | run `npx zod-to-form generate` (via `createProgram()`) instead |
| `runGenerate` | Browser environments | this function uses Node.js `fs` and `path` APIs |
| `createProgram` | You just want to generate a form from a script | use `runGenerate()` directly |
| `createProgram` | End-user invocation | use `npx zod-to-form` (the binary entry point) instead |
| `defineConfig` | Runtime-only usage where you pass config inline to walkSchema | — |
| `validateConfig` | Using TypeScript with defineConfig() | type errors catch most issues at dev time |
- API surface: 4 functions, 1 types

## Pitfalls

- NEVER call with a schema that already has a generated output file when
- `defaults.overwrite` is false — the function silently skips writing and returns
- `wroteFile: false` with no error; this is intentional but easy to miss in scripts
- NEVER rely on generated file content after re-running `runGenerate` without
- checking `wroteFile` — if the file already exists and overwrite is disabled,
- the on-disk file is NOT updated even though `code` is returned
- NEVER use `--watch` mode on schema files that have indirect imports — the watcher
- only tracks the top-level schema file, not its transitive dependencies
- NEVER call `program.parse()` (synchronous) in ESM environments — use
- `.parseAsync(process.argv)` instead or the program will silently not execute
- NEVER assume preset props merge with your props — the entire props dict is replaced. If you set component props, you must include ALL props including the ones from the preset
- NEVER use as a type guard — it throws on invalid input, doesn't narrow
- NEVER assume extra keys cause failures — the schema uses z.object().loose(), extra keys are silently ignored

## Configuration

2 configuration interfaces — see references/config.md for details.

## Quick Reference

**CLI:** `runGenerate` (Executes the code generation pipeline for a single Zod schema export), `createProgram` (Creates the Commander)
**Configuration:** `defineConfig` (Identity helper that returns its argument typed as `ZodFormsConfig`), `validateConfig` (Validates an unknown value as a `ZodFormsConfig` at runtime)
**config.d:** `ComponentOverride` (Per-component metadata override)

## Links

- [Repository](https://github.com/pradeepmouli/zod-to-form)
- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
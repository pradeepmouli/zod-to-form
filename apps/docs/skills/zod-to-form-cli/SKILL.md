---
name: zod-to-form-cli
description: "Documentation site for zod-to-form (Docusaurus 3 + TypeDoc) @zod-to-form/cli — Build-time CLI for generating React form components from Zod v4 schemas. Use when: You need programmatic codegen from a Node.js script or build tool (not just the CLI); You are writing tests for the code generation pipeline end-to-end; You need `dryRun` output for preview/diffing without touching the filesystem."
---

# @zod-to-form/cli

Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)

Before using the CLI, decide: are you scripting (use `runGenerate`) or interacting
(use `npx zod-to-form`)? For config authoring, always use `defineConfig` for type inference.

## When to Use


| Task | Use |
|------|-----|
| You need programmatic codegen from a Node.js script or build tool (not just the CLI) | `runGenerate` |
| You are writing tests for the code generation pipeline end-to-end | `runGenerate` |
| You need `dryRun` output for preview/diffing without touching the filesystem | `runGenerate` |
| Testing CLI commands programmatically without spawning a child process | `createProgram` |
| Extending the CLI with custom sub-commands in a wrapper tool | `createProgram` |
| Writing z2f.config.ts for CLI codegen (primary use case) | `defineConfig` |
| You want TypeScript inference and IDE autocompletion for config | `defineConfig` |
| Loading config from JSON files or dynamic import() | `validateConfig` |
| You need runtime validation of user-provided config | `validateConfig` |

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

- NEVER call with a schema that already has a generated output file when `defaults.overwrite` is false — the function silently skips writing and returns `wroteFile: false` with no error; this is intentional but easy to miss in scripts — check result.wroteFile and set defaults.overwrite: true or delete the file first
- NEVER rely on generated file content after re-running `runGenerate` without checking `wroteFile` — if the file already exists and overwrite is disabled, the on-disk file is NOT updated even though `code` is returned
- NEVER use `--watch` mode on schema files that have indirect imports — the watcher only tracks the top-level schema file, not its transitive dependencies
- NEVER call `program.parse()` (synchronous) in ESM environments — use `.parseAsync(process.argv)` instead or the program will silently not execute
- NEVER assume preset props merge with your props — the entire props dict is replaced. If you set component props, you must include ALL props including the ones from the preset
- NEVER use as a type guard — it throws on invalid input, doesn't narrow
- NEVER assume extra keys cause failures — the schema uses z.object().loose(), extra keys are silently ignored

## Configuration

**ZodFormsConfig** — Root configuration type for `zod-to-form` code generation.

Describes the component library to use, generation defaults, per-schema
overrides, and global field configuration. Pass this to `defineConfig()` in
your `z2f.config.ts` for full type inference, or load and validate it at
runtime with `validateConfig()`. (7 options — see references/config.md)

## Quick Reference

**CLI:** `runGenerate` (Executes the code generation pipeline for a single Zod schema export), `createProgram` (Creates the Commander)
**Configuration:** `defineConfig` (Identity helper that returns its argument typed as `ZodFormsConfig`), `validateConfig` (Validates an unknown value as a `ZodFormsConfig` at runtime)
**config.d:** `ComponentOverride` (Per-component metadata override)

## References

Load these on demand — do NOT read all at once:

- When calling any function → read `references/functions.md` for full signatures, parameters, and return types
- When defining typed variables or function parameters → read `references/types.md`
- When configuring options → read `references/config.md` for all settings and defaults

## Links

- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
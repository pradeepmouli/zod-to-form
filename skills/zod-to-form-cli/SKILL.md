---
name: zod-to-form-cli
description: "Build-time code generator for Zod v4 form components @zod-to-form/cli — Build-time CLI for generating React form components from Zod v4 schemas. Use when: You need programmatic codegen from a Node.js script or build tool (not just the CLI); You are writing tests for the code generation pipeline end-to-end; You need `dryRun` output for preview/diffing without touching the filesystem."
license: MIT
---

# @zod-to-form/cli

Build-time code generator for Zod v4 form components

Before using the CLI, decide: are you scripting (use `runGenerate`) or interacting
(use `npx zod-to-form`)? For config authoring, always use `defineConfig` for type inference.

## Quick Start

```bash
zod-to-form generate --config ./z2f.config.ts --schema ./src/schema.ts --export userSchema
```

```bash
zod-to-form init
```

Alias: `z2f`.

### Command

`zod-to-form generate`

Required options:

- `--config <path>`: path to config file (`.json` or `.ts`) that drives generation
- `--schema <path>`: path to schema module

Optional options:

- `--export <name>`: named export containing the schema (optional when `config.types` or `config.include` are set)
- `--mode <mode>`: `submit | auto-save` (default `submit`)
- `--out <path>`: output directory or `.tsx` file path
- `--name <componentName>`: generated component name override
- `--ui <preset>`: `shadcn | html` (default `shadcn`)
- `--dry-run`: print generated code to stdout without writing files
- `--server-action`: generate Next.js server action next to form output
- `--watch`: watch schema file and regenerate on changes

Generation selection/overwrite is now config-driven:

- `overwrite`: overwrite existing output files
- `types`: explicit list of schema exports to generate (used when `--export` is omitted)
- `include`: wildcard include patterns for schema export names
- `exclude`: wildcard exclude patterns for schema export names

When generating with `--config`, component mapping and generation controls come from the same file.
Default config discovery order (used by runtime helpers / existing workflows) is still:

1. `z2f.config.ts`
2. `component-config.ts`
3. `z2f.config.js`
4. `component-config.js`
5. `z2f.config.json`
6. `component-config.json`

### Command

`zod-to-form init`

Creates `z2f.config.ts` using sensible defaults and introspection of shadcn `components.json` when available.

Optional options:

- `--out <path>`: output file or directory (default `z2f.config.ts`)
- `--components <modulePath>`: module path assigned to `components` in generated config (overrides inference)
- `--schemas <path>`: path to schema file or directory for autodiscovery
- `--force`: overwrite existing config file
- `--dry-run`: print generated config and skip file writes
- `--verbose`: print detailed diagnostics for each step

Output behavior:

- default: concise progress + final summary
- `--verbose`: adds detailed diagnostics (detected config source/aliases)

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

2 configuration interfaces — see references/config.md for details.

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

- [Repository](https://github.com/pradeepmouli/zod-to-form)
- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
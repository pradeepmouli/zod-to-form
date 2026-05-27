---
description: "Documentation site for zod-to-form (Docusaurus 3 + TypeDoc) Use when: You need programmatic codegen from a Node.js script or build tool (not just...."
name: zod-to-form-cli
---

# @zod-to-form/cli

Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)

Before using the CLI, decide: are you scripting (use `runGenerate`) or interacting
(use `npx zod-to-form`)? For config authoring, always use `defineConfig` for type inference.

## When to Use

**Use this skill when:**
- You need programmatic codegen from a Node.js script or build tool (not just the CLI) → use `runGenerate`
- You are writing tests for the code generation pipeline end-to-end → use `runGenerate`
- You need `dryRun` output for preview/diffing without touching the filesystem → use `runGenerate`
- Testing CLI commands programmatically without spawning a child process → use `createProgram`
- Extending the CLI with custom sub-commands in a wrapper tool → use `createProgram`
- You want TypeScript inference and IDE autocompletion for config → use `defineConfig` — `defineConfig` is the typed entry point; bare object literals lose generic inference on `components.overrides`
- Loading config from JSON files or dynamic import() where the type is `unknown` → use `validateConfig` — validates and narrows to `ZodFormsConfig`

**Do NOT use when:**
- Interactive use — run `npx zod-to-form generate` (via `createProgram()`) instead (`runGenerate`)
- Browser environments — this function uses Node.js `fs` and `path` APIs (`runGenerate`)
- You just want to generate a form from a script — use `runGenerate()` directly (`createProgram`)
- End-user invocation — use `npx zod-to-form` (the binary entry point) instead (`createProgram`)
- Runtime-only usage where you pass config inline to walkSchema — `defineConfig` is a no-op at runtime without a preset; skip it when config comes from JSON or dynamic import (`defineConfig`)
- Using TypeScript with defineConfig() — type errors catch most issues at dev time; validateConfig is only needed when the config source is not type-checkable (`validateConfig`)

API surface: 4 functions, 1 types

## NEVER

- NEVER treat `result.code` as the on-disk file content when `overwrite` is false — if the output file already exists, `runGenerate` returns `wroteFile: false` and the existing file is unchanged without throwing; FIX: check `result.wroteFile` before assuming the file was updated, or set `defaults.overwrite: true` explicitly
- NEVER use `--watch` mode on schemas that re-export types from other modules — the watcher tracks only the top-level file, so a change in an imported schema file does not trigger regeneration; FIX: run `runGenerate` manually from a parent file watcher (e.g. chokidar) that covers the full import tree
- NEVER call `program.parse()` (synchronous) in ESM environments — Commander's synchronous parse returns before async action handlers complete in ESM because it cannot await top-level async actions; FIX: always use `.parseAsync(process.argv)`
- NEVER assume preset props merge with your props — the entire props dict is replaced. If you set component props, you must include ALL props including the ones from the preset
- NEVER use as a type guard — it throws on invalid input, doesn't narrow; FIX: wrap in try/catch and branch on success, or check keys manually before calling
- NEVER assume extra keys cause failures — the schema uses z.object().loose(), so unrecognized keys are silently dropped not rejected; FIX: if you need strict key validation, inspect the returned config for unexpected fields manually

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
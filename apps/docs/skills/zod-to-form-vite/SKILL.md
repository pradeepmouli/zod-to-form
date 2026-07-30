---
description: "Vite plugin for zod-to-form — transforms `?z2f` imports into generated form components and replaces `<ZodForm>` JSX call sites with static output at build time.\n\nTwo modes:\n- **Query mode** (`?z2f` imports): import a schema file with a `?z2f` query\n  parameter to receive a fully-generated React form component as a virtual\n  module. Zero build step — the plugin compiles on demand.\n- **Generate mode** (`options.generate`): scan JSX source files for\n  `<ZodForm>` call sites and replace statically-resolvable ones with\n  generated form components at build time. Opt-in via `generate: {}`.\n\nConfig resolution order:\n  1. `options.configPath` if explicitly provided\n  2. Auto-discovery of `z2f.config.{ts,mts,js,mjs}` in the Vite root\n  3. `DEFAULT_CONFIG` merged with `options.configOverride` Use when: You want `import SignupForm from './signup.schema?z2f'` to Just Work in a...."
name: zod-to-form-vite
---

# @zod-to-form/vite

Vite plugin for zod-to-form — transforms `?z2f` imports into generated form components and replaces `<ZodForm>` JSX call sites with static output at build time.

Two modes:
- **Query mode** (`?z2f` imports): import a schema file with a `?z2f` query
  parameter to receive a fully-generated React form component as a virtual
  module. Zero build step — the plugin compiles on demand.
- **Generate mode** (`options.generate`): scan JSX source files for
  `<ZodForm>` call sites and replace statically-resolvable ones with
  generated form components at build time. Opt-in via `generate: {}`.

Config resolution order:
  1. `options.configPath` if explicitly provided
  2. Auto-discovery of `z2f.config.{ts,mts,js,mjs}` in the Vite root
  3. `DEFAULT_CONFIG` merged with `options.configOverride`

Two modes: `?z2f` query imports (transform per-import, HMR works) vs `generate` mode
(static JSX rewriting, no HMR integration). Use `?z2f` for new forms, `generate` for
migrating existing `<ZodForm>` call sites.

## When to Use

**Use this skill when:**
- You want `import SignupForm from './signup.schema?z2f'` to Just Work in a Vite app → use `z2fVite` — the plugin intercepts the import and compiles the form on demand
- You want HMR-aware form recompilation when schemas change in development → use `z2fVite` — only the affected virtual modules are invalidated
- You want to run generate mode to pre-compile forms from `<ZodForm>` call sites → use `z2fVite` — opt in via `generate: {}` in plugin options
- Catching plugin errors in integration tests: `expect(fn).toThrow(/Z2F_VITE_/))` → use `Z2FViteError`
- Wrapping plugin calls in error handlers that need to branch on specific error codes → use `Z2FViteError`

**Do NOT use when:**
- You are building with webpack, esbuild, Rollup, or any non-Vite bundler — use `@zod-to-form/cli` instead (`z2fVite`)
- Your schemas have cyclic references — the walker will recurse infinitely on them; break cycles before using the plugin (`z2fVite`)
- You need server-side form rendering without a React runtime — static codegen produces lighter SSR-compatible output (`z2fVite`)
- General application error handling — this class is specific to plugin-level failures; use standard `Error` or your own error hierarchy for application errors (`Z2FViteError`)

API surface: 2 functions, 1 classes, 6 types

## NEVER

- NEVER use `?z2f` on schemas with cyclic type references — the schema walker recurses on Zod's internal type graph and hangs with no error or timeout; FIX: break cycles with `z.lazy()` before using the `?z2f` import
- NEVER enable `generate` mode and then rely on HMR without testing — the generate-mode transform cache does not integrate with Vite's standard HMR module invalidation for rewritten JSX files; FIX: disable generate mode during development and only enable it in production builds
- NEVER configure `configPath` to point outside the Vite `root` — the plugin uses `ssrLoadModule` with a dev server scoped to `root`, so files outside that boundary may fail to resolve their own imports; FIX: move the config into the Vite root or set `root` to include it — produces Z2F_VITE_SCHEMA_OUTSIDE_ROOT error
- NEVER compare `error.message` to detect error type — the `[Z2F_VITE_...]` prefix in the message is an implementation detail and may change; FIX: always check `error.code` (e.g. `error.code === 'Z2F_VITE_SCHEMA_NOT_FOUND'`) for stable, semver-stable matching

## Configuration

4 configuration interfaces — see references/config.md for details.

## Quick Reference

**Plugin:** `z2fVite` (Vite plugin factory for `@zod-to-form/vite`)
**Errors:** `formatZ2FViteError` (Format a `Z2FViteError` for inclusion in a Vite error overlay or terminal output), `Z2FViteError` (Structured error thrown by the `@zod-to-form/vite` plugin), `Z2FViteErrorLocation` (Source location attached to a `Z2FViteError` for IDE navigation and Vite overlay display)
**types:** `GenerationTarget` (A single (schema, variant, config) triple that produces exactly one
generated form), `CompilationEntry` (One cached compilation result), `GenerateSite` (A single `<ZodForm>` JSX element matched by generate mode), `HMRInvalidationMap` (The graph edges that `handleHotUpdate` walks when a watched file changes)
**errors:** `Z2FViteErrorCode` (Plugin error classes)

## References

Load these on demand — do NOT read all at once:

- When calling any function → read `references/functions.md` for full signatures, parameters, and return types
- When using a class → read `references/classes.md` for properties, methods, and inheritance
- When defining typed variables or function parameters → read `references/types.md`
- When configuring options → read `references/config.md` for all settings and defaults

## Links

- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
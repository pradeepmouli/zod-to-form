---
name: zod-to-form-vite
description: "Documentation site for zod-to-form (Docusaurus 3 + TypeDoc) Use when: You want `import SignupForm from './signup.schema?z2f'` to Just Work in a Vite app; You want HMR-aware form recompilation when schemas change in development; You want to run generate mode to pre-compile forms from `<ZodForm>` call sites."
---

# @zod-to-form/vite

Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)

Two modes: `?z2f` query imports (transform per-import, HMR works) vs `generate` mode
(static JSX rewriting, no HMR integration). Use `?z2f` for new forms, `generate` for
migrating existing `<ZodForm>` call sites.

## When to Use


| Task | Use |
|------|-----|
| You want `import SignupForm from './signup.schema?z2f'` to Just Work in a Vite app | `z2fVite` |
| You want HMR-aware form recompilation when schemas change in development | `z2fVite` |
| You want to run generate mode to pre-compile forms from `<ZodForm>` call sites | `z2fVite` |
| Catching plugin errors in integration tests: `expect(fn).toThrow(/Z2F_VITE_/))` | `Z2FViteError` |
| Wrapping plugin calls in error handlers that need to branch on specific error codes | `Z2FViteError` |

**Avoid when:**

| Don't Use | When | Use Instead |
|-----------|------|-------------|
| `z2fVite` | You are building with webpack, esbuild, Rollup, or any non-Vite bundler | — |
| `z2fVite` | Your schemas have cyclic references | the walker will recurse infinitely on them |
| `z2fVite` | You need server-side form rendering without a React runtime | — |
| `Z2FViteError` | General application error handling | this class is specific to plugin-level failures |
- API surface: 2 functions, 1 classes, 6 types

## Pitfalls

- NEVER use `?z2f` on schemas with cyclic type references — the schema walker recurses on Zod's internal type graph and hangs on cycles
- NEVER enable `generate` mode and then rely on HMR without testing — the generate-mode transform cache does not integrate with Vite's standard HMR module invalidation for rewritten JSX files
- NEVER assume Zod types survive Vite's module graph isolation — always export schemas from a dedicated `.schema.ts` file; importing from a module that re-exports through complex chains can fail under `ssrLoadModule`
- NEVER configure `configPath` to point outside the Vite `root` — the plugin uses `ssrLoadModule` with a dev server scoped to `root`, so files outside that boundary may fail to resolve their own imports
- NEVER compare `error.message` to detect error type — the message format may change. Use `error.code` (e.g. `error.code === 'Z2F_VITE_SCHEMA_NOT_FOUND'`) for stable matching

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
- When using a class → read `references/classes/` for properties, methods, and inheritance
- When defining typed variables or function parameters → read `references/types.md`
- When configuring options → read `references/config.md` for all settings and defaults

## Links

- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
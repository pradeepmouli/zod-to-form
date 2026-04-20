---
name: zod-to-form-vite
description: "Vite plugin for zod-to-form — transforms ?z2f imports into generated form components and optionally replaces <ZodForm> JSX call sites with generated components at build time Use when: You want `import SignupForm from './signup.schema?z2f'` to Just Work in a Vite app; You want HMR-aware form recompilation when schemas change in development; You want to run generate mode to pre-compile forms from `<ZodForm>` call sites."
license: MIT
---

# @zod-to-form/vite

Vite plugin for zod-to-form — transforms ?z2f imports into generated form components and optionally replaces <ZodForm> JSX call sites with generated components at build time

## When to Use


| Task | Use | Why |
|------|-----|-----|
| You want `import SignupForm from './signup.schema?z2f'` to Just Work in a Vite app | `z2fVite` | — |
| You want HMR-aware form recompilation when schemas change in development | `z2fVite` | — |
| You want to run generate mode to pre-compile forms from `<ZodForm>` call sites | `z2fVite` | — |
| Catching plugin errors in integration tests: `expect(fn).toThrow(/Z2F_VITE_/))` | `Z2FViteError` | — |
| Wrapping plugin calls in error handlers that need to branch on specific error codes | `Z2FViteError` | — |

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

## Links

- [Repository](https://github.com/pradeepmouli/zod-to-form)
- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
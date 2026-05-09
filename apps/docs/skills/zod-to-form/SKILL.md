---
name: zod-to-form
description: "Use when working with zod-to-form (core, react, cli, codegen, vite)."
---
# zod-to-form

**Use this skill for ANY work with zod-to-form.** It routes to the correct package.

## When to Use

Use this router when:
- Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)
- Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)
- Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)
- Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)
- Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)

## Decision Tree

1. Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)? → `zod-to-form-core`
2. Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)? → `zod-to-form-react`
3. Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)? → `zod-to-form-cli`
4. Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)? → `zod-to-form-codegen`
5. Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)? → `zod-to-form-vite`

## Routing Logic

### core → `zod-to-form-core`

Requires Zod v4 — uses `_zod.def`, `_zod.bag`, and `z.registry()` APIs.
Does NOT work with Zod v3 (which uses `_def` internals).

- You want per-field validation instead of whole-form validation
- You need native HTML validation attributes (required, minLength, pattern)
- You want TypeScript inference and IDE autocompletion for config — `defineConfig` is the typed entry point; bare object literals lose generic inference on `components.overrides`

Key APIs: `canonicalizeConfig`, `createOptimizers`, `createSchemaLiteCollector`

### react → `zod-to-form-react`

Choose your abstraction level: `<ZodForm>` for zero-config, `useZodForm` for custom
rendering, manual `walkSchema` for full control. Each step down trades convenience for
flexibility.

- You need form rendering in storybook, playgrounds, or low-traffic admin UIs — where bundle overhead is acceptable and a build step would add friction
- You are prototyping before committing to CLI codegen — `<ZodForm>` and the CLI share the same walkSchema output so the migration is mechanical
- You need direct access to the RHF `form` instance (e.g. to call `form.setValue`)

Key APIs: `ZodForm`, `useZodForm`, `useExternalSync`

### cli → `zod-to-form-cli`

Before using the CLI, decide: are you scripting (use `runGenerate`) or interacting
(use `npx zod-to-form`)? For config authoring, always use `defineConfig` for type inference.

- You need programmatic codegen from a Node.js script or build tool (not just the CLI)
- You are writing tests for the code generation pipeline end-to-end
- You need `dryRun` output for preview/diffing without touching the filesystem

Key APIs: `runGenerate`, `createProgram`, `defineConfig`

### codegen → `zod-to-form-codegen`

- Building a custom codegen pipeline that assembles `FormField[]` and needs the TSX string
- Writing codegen tests that verify output structure without spawning a CLI process
- Building a custom codegen backend that needs the same override resolution logic as the CLI

Key APIs: `generateFormComponent`, `resolveFieldMapping`, `getFileHeader`

### vite → `zod-to-form-vite`

Two modes: `?z2f` query imports (transform per-import, HMR works) vs `generate` mode
(static JSX rewriting, no HMR integration). Use `?z2f` for new forms, `generate` for
migrating existing `<ZodForm>` call sites.

- You want `import SignupForm from './signup.schema?z2f'` to Just Work in a Vite app — the plugin intercepts the import and compiles the form on demand
- You want HMR-aware form recompilation when schemas change in development — only the affected virtual modules are invalidated
- You want to run generate mode to pre-compile forms from `<ZodForm>` call sites — opt in via `generate: {}` in plugin options

Key APIs: `Z2FViteError`, `z2fVite`, `formatZ2FViteError`

## Critical Patterns

Top pitfall per package:
- NEVER mutate builtinOptimizers — it's a module singleton. Always use createOptimizers(custom) (core)
- NEVER pass `componentConfig` without a matching `components` map that covers the component names referenced — missing components are silently dropped at render time with no console error; add each name to `components` or use `defaultComponentMap` as the base (react)
- NEVER treat `result.code` as the on-disk file content when `overwrite` is false — if the output file already exists, `runGenerate` returns `wroteFile: false` and the existing file is unchanged without throwing; FIX: check `result.wroteFile` before assuming the file was updated, or set `defaults.overwrite: true` explicitly (cli)
- NEVER call `generateFormComponent` with a stale `fields` array from a previous schema version — there is no cache invalidation; callers must re-run `walkSchema` on schema change (codegen)
- NEVER use `?z2f` on schemas with cyclic type references — the schema walker recurses on Zod's internal type graph and hangs with no error or timeout; FIX: break cycles with `z.lazy()` before using the `?z2f` import (vite)

## Anti-Rationalization

| Thought | Reality |
|---------|---------|
| "I'll just use core for everything" | core is for documentation site for zod-to-form (docusaurus 3 + typedoc). You only need whole-schema validation — omit the optimization option entirely |
| "I'll just use react for everything" | react is for documentation site for zod-to-form (docusaurus 3 + typedoc). Bundle size is critical — use CLI codegen (`@zod-to-form/cli`) instead; runtime schema walking includes the full Zod type graph traversal, which does not tree-shake |
| "I'll just use cli for everything" | cli is for documentation site for zod-to-form (docusaurus 3 + typedoc). Interactive use — run `npx zod-to-form generate` (via `createProgram()`) instead |
| "I'll just use codegen for everything" | codegen is for documentation site for zod-to-form (docusaurus 3 + typedoc). You want file-writing behavior — use `runGenerate()` from `@zod-to-form/cli` instead |
| "I'll just use vite for everything" | vite is for documentation site for zod-to-form (docusaurus 3 + typedoc). You are building with webpack, esbuild, Rollup, or any non-Vite bundler — use `@zod-to-form/cli` instead |

## Example Invocations

User: "I need to documentation site for zod-to-form (docusaurus 3 + typedoc)"  
→ Load `zod-to-form-core`

User: "I need to documentation site for zod-to-form (docusaurus 3 + typedoc)"  
→ Load `zod-to-form-react`

User: "I need to documentation site for zod-to-form (docusaurus 3 + typedoc)"  
→ Load `zod-to-form-cli`

User: "I need to documentation site for zod-to-form (docusaurus 3 + typedoc)"  
→ Load `zod-to-form-codegen`

User: "I need to documentation site for zod-to-form (docusaurus 3 + typedoc)"  
→ Load `zod-to-form-vite`

## NEVER

- NEVER load all package skills simultaneously — pick the one matching your task
- If your task spans multiple packages, load the foundational one first (typically core/shared), then the specific one

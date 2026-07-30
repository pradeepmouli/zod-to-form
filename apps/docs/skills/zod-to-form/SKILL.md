---
name: zod-to-form
description: "Use when working with zod-to-form (core, react, cli, codegen, vite)."
---
# zod-to-form

**Use this skill for ANY work with zod-to-form.** It routes to the correct package.

## When to Use

Use this router when:
- Schema-driven form generation for Zod v4.

Two paths to forms:
- **CLI codegen** (recommended): Write a `z2f.config.ts`, run `npx zod-to-form generate`,
  get static `.tsx` components. Zero runtime overhead, hand-readable output.
- **Runtime**: Import `walkSchema()` and render dynamically with `useZodForm()` in React.

Both paths share the same core: a recursive schema walker that produces `FormField[]`
from Zod v4's native introspection API.
- Runtime React renderer for Zod v4 form schemas — wraps react-hook-form with a schema walker that maps Zod types to form components.

Provides the `<ZodForm>` component and `useZodForm()` hook for dynamically rendering
forms from a `z.object()` schema at runtime — no codegen required. Use this package
when you need schema-driven forms that adapt to runtime schema changes.

Key exports:
- `ZodForm` — the top-level form component; wraps RHF `FormProvider`
- `useZodForm` — hook that calls `walkSchema` and wires up RHF for you
- `normalizeFormValues` — call before `schema.safeParse()` to convert HTML empty strings
- `defaultComponentMap` — the built-in HTML component set
- `shadcnComponentMap` — the shadcn/ui component set
- `wrapWithSchemaLite` — wrap a submit handler with the lite schema for optimized validation
- @zod-to-form/cli — Build-time CLI for generating React form components from Zod v4 schemas.

Drives the full code generation pipeline: loads a schema file, walks the Zod internal
type tree via `@zod-to-form/core`, applies per-field overrides from `z2f.config.ts`,
and emits static `.tsx` form components — optionally alongside a Next.js server action
and a schema-lite file for optimized client-side validation.
- Browser-safe code generation utilities for Zod v4 form components.

Provides the building blocks for generating React form TSX files from a
`FormField[]` tree and a `ZodFormsConfig`. No Node.js dependencies — safe
to import in browser and server environments alike.

Key exports:
- `generateFormComponent` — produce a complete TSX form component string
- `getFileHeader` — emit import declarations for generated files
- `renderField` — render a single field to its JSX string
- `buildConfigSource` — generate a `z2f.config.ts` starter file
- `getFieldTemplateSource` — emit the preset FieldTemplate component source
- `generateSchemaLiteFile` — emit the lite schema file for optimized validation
- Vite plugin for zod-to-form — transforms `?z2f` imports into generated form components and replaces `<ZodForm>` JSX call sites with static output at build time.

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

## Decision Tree

1. Schema-driven form generation for Zod v4.

Two paths to forms:
- **CLI codegen** (recommended): Write a `z2f.config.ts`, run `npx zod-to-form generate`,
  get static `.tsx` components. Zero runtime overhead, hand-readable output.
- **Runtime**: Import `walkSchema()` and render dynamically with `useZodForm()` in React.

Both paths share the same core: a recursive schema walker that produces `FormField[]`
from Zod v4's native introspection API.? → `zod-to-form-core`
2. Runtime React renderer for Zod v4 form schemas — wraps react-hook-form with a schema walker that maps Zod types to form components.

Provides the `<ZodForm>` component and `useZodForm()` hook for dynamically rendering
forms from a `z.object()` schema at runtime — no codegen required. Use this package
when you need schema-driven forms that adapt to runtime schema changes.

Key exports:
- `ZodForm` — the top-level form component; wraps RHF `FormProvider`
- `useZodForm` — hook that calls `walkSchema` and wires up RHF for you
- `normalizeFormValues` — call before `schema.safeParse()` to convert HTML empty strings
- `defaultComponentMap` — the built-in HTML component set
- `shadcnComponentMap` — the shadcn/ui component set
- `wrapWithSchemaLite` — wrap a submit handler with the lite schema for optimized validation? → `zod-to-form-react`
3. @zod-to-form/cli — Build-time CLI for generating React form components from Zod v4 schemas.

Drives the full code generation pipeline: loads a schema file, walks the Zod internal
type tree via `@zod-to-form/core`, applies per-field overrides from `z2f.config.ts`,
and emits static `.tsx` form components — optionally alongside a Next.js server action
and a schema-lite file for optimized client-side validation.? → `zod-to-form-cli`
4. Browser-safe code generation utilities for Zod v4 form components.

Provides the building blocks for generating React form TSX files from a
`FormField[]` tree and a `ZodFormsConfig`. No Node.js dependencies — safe
to import in browser and server environments alike.

Key exports:
- `generateFormComponent` — produce a complete TSX form component string
- `getFileHeader` — emit import declarations for generated files
- `renderField` — render a single field to its JSX string
- `buildConfigSource` — generate a `z2f.config.ts` starter file
- `getFieldTemplateSource` — emit the preset FieldTemplate component source
- `generateSchemaLiteFile` — emit the lite schema file for optimized validation? → `zod-to-form-codegen`
5. Vite plugin for zod-to-form — transforms `?z2f` imports into generated form components and replaces `<ZodForm>` JSX call sites with static output at build time.

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
  3. `DEFAULT_CONFIG` merged with `options.configOverride`? → `zod-to-form-vite`

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
| "I'll just use core for everything" | core is for schema-driven form generation for zod v4.

two paths to forms:
- **cli codegen** (recommended): write a `z2f.config.ts`, run `npx zod-to-form generate`,
  get static `.tsx` components. zero runtime overhead, hand-readable output.
- **runtime**: import `walkschema()` and render dynamically with `usezodform()` in react.

both paths share the same core: a recursive schema walker that produces `formfield[]`
from zod v4's native introspection api.. You only need whole-schema validation — omit the optimization option entirely |
| "I'll just use react for everything" | react is for runtime react renderer for zod v4 form schemas — wraps react-hook-form with a schema walker that maps zod types to form components.

provides the `<zodform>` component and `usezodform()` hook for dynamically rendering
forms from a `z.object()` schema at runtime — no codegen required. use this package
when you need schema-driven forms that adapt to runtime schema changes.

key exports:
- `zodform` — the top-level form component; wraps rhf `formprovider`
- `usezodform` — hook that calls `walkschema` and wires up rhf for you
- `normalizeformvalues` — call before `schema.safeparse()` to convert html empty strings
- `defaultcomponentmap` — the built-in html component set
- `shadcncomponentmap` — the shadcn/ui component set
- `wrapwithschemalite` — wrap a submit handler with the lite schema for optimized validation. Bundle size is critical — use CLI codegen (`@zod-to-form/cli`) instead; runtime schema walking includes the full Zod type graph traversal, which does not tree-shake |
| "I'll just use cli for everything" | cli is for @zod-to-form/cli — build-time cli for generating react form components from zod v4 schemas.

drives the full code generation pipeline: loads a schema file, walks the zod internal
type tree via `@zod-to-form/core`, applies per-field overrides from `z2f.config.ts`,
and emits static `.tsx` form components — optionally alongside a next.js server action
and a schema-lite file for optimized client-side validation.. Interactive use — run `npx zod-to-form generate` (via `createProgram()`) instead |
| "I'll just use codegen for everything" | codegen is for browser-safe code generation utilities for zod v4 form components.

provides the building blocks for generating react form tsx files from a
`formfield[]` tree and a `zodformsconfig`. no node.js dependencies — safe
to import in browser and server environments alike.

key exports:
- `generateformcomponent` — produce a complete tsx form component string
- `getfileheader` — emit import declarations for generated files
- `renderfield` — render a single field to its jsx string
- `buildconfigsource` — generate a `z2f.config.ts` starter file
- `getfieldtemplatesource` — emit the preset fieldtemplate component source
- `generateschemalitefile` — emit the lite schema file for optimized validation. You want file-writing behavior — use `runGenerate()` from `@zod-to-form/cli` instead |
| "I'll just use vite for everything" | vite is for vite plugin for zod-to-form — transforms `?z2f` imports into generated form components and replaces `<zodform>` jsx call sites with static output at build time.

two modes:
- **query mode** (`?z2f` imports): import a schema file with a `?z2f` query
  parameter to receive a fully-generated react form component as a virtual
  module. zero build step — the plugin compiles on demand.
- **generate mode** (`options.generate`): scan jsx source files for
  `<zodform>` call sites and replace statically-resolvable ones with
  generated form components at build time. opt-in via `generate: {}`.

config resolution order:
  1. `options.configpath` if explicitly provided
  2. auto-discovery of `z2f.config.{ts,mts,js,mjs}` in the vite root
  3. `default_config` merged with `options.configoverride`. You are building with webpack, esbuild, Rollup, or any non-Vite bundler — use `@zod-to-form/cli` instead |

## Example Invocations

User: "I need to schema-driven form generation for zod v4.

two paths to forms:
- **cli codegen** (recommended): write a `z2f.config.ts`, run `npx zod-to-form generate`,
  get static `.tsx` components. zero runtime overhead, hand-readable output.
- **runtime**: import `walkschema()` and render dynamically with `usezodform()` in react.

both paths share the same core: a recursive schema walker that produces `formfield[]`
from zod v4's native introspection api."  
→ Load `zod-to-form-core`

User: "I need to runtime react renderer for zod v4 form schemas — wraps react-hook-form with a schema walker that maps zod types to form components.

provides the `<zodform>` component and `usezodform()` hook for dynamically rendering
forms from a `z.object()` schema at runtime — no codegen required. use this package
when you need schema-driven forms that adapt to runtime schema changes.

key exports:
- `zodform` — the top-level form component; wraps rhf `formprovider`
- `usezodform` — hook that calls `walkschema` and wires up rhf for you
- `normalizeformvalues` — call before `schema.safeparse()` to convert html empty strings
- `defaultcomponentmap` — the built-in html component set
- `shadcncomponentmap` — the shadcn/ui component set
- `wrapwithschemalite` — wrap a submit handler with the lite schema for optimized validation"  
→ Load `zod-to-form-react`

User: "I need to @zod-to-form/cli — build-time cli for generating react form components from zod v4 schemas.

drives the full code generation pipeline: loads a schema file, walks the zod internal
type tree via `@zod-to-form/core`, applies per-field overrides from `z2f.config.ts`,
and emits static `.tsx` form components — optionally alongside a next.js server action
and a schema-lite file for optimized client-side validation."  
→ Load `zod-to-form-cli`

User: "I need to browser-safe code generation utilities for zod v4 form components.

provides the building blocks for generating react form tsx files from a
`formfield[]` tree and a `zodformsconfig`. no node.js dependencies — safe
to import in browser and server environments alike.

key exports:
- `generateformcomponent` — produce a complete tsx form component string
- `getfileheader` — emit import declarations for generated files
- `renderfield` — render a single field to its jsx string
- `buildconfigsource` — generate a `z2f.config.ts` starter file
- `getfieldtemplatesource` — emit the preset fieldtemplate component source
- `generateschemalitefile` — emit the lite schema file for optimized validation"  
→ Load `zod-to-form-codegen`

User: "I need to vite plugin for zod-to-form — transforms `?z2f` imports into generated form components and replaces `<zodform>` jsx call sites with static output at build time.

two modes:
- **query mode** (`?z2f` imports): import a schema file with a `?z2f` query
  parameter to receive a fully-generated react form component as a virtual
  module. zero build step — the plugin compiles on demand.
- **generate mode** (`options.generate`): scan jsx source files for
  `<zodform>` call sites and replace statically-resolvable ones with
  generated form components at build time. opt-in via `generate: {}`.

config resolution order:
  1. `options.configpath` if explicitly provided
  2. auto-discovery of `z2f.config.{ts,mts,js,mjs}` in the vite root
  3. `default_config` merged with `options.configoverride`"  
→ Load `zod-to-form-vite`

## NEVER

- NEVER load all package skills simultaneously — pick the one matching your task
- If your task spans multiple packages, load the foundational one first (typically core/shared), then the specific one

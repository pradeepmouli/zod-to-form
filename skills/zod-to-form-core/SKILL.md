---
description: "Schema-driven form generation for Zod v4.\n\nTwo paths to forms:\n- **CLI codegen** (recommended): Write a `z2f.config.ts`, run `npx zod-to-form generate`,\n  get static `.tsx` components. Zero runtime overhead, hand-readable output.\n- **Runtime**: Import `walkSchema()` and render dynamically with `useZodForm()` in React.\n\nBoth paths share the same core: a recursive schema walker that produces `FormField[]`\nfrom Zod v4's native introspection API. Use when: You want per-field validation instead of whole-form validation. Also: zod, zod-v4, forms, form-generation, schema, schema-walker, processor-registry, react-hook-form, schema-driven, form-schema, zod-registry."
license: MIT
name: zod-to-form-core
---

# @zod-to-form/core

Schema-driven form generation for Zod v4.

Two paths to forms:
- **CLI codegen** (recommended): Write a `z2f.config.ts`, run `npx zod-to-form generate`,
  get static `.tsx` components. Zero runtime overhead, hand-readable output.
- **Runtime**: Import `walkSchema()` and render dynamically with `useZodForm()` in React.

Both paths share the same core: a recursive schema walker that produces `FormField[]`
from Zod v4's native introspection API.

Requires Zod v4 — uses `_zod.def`, check definitions, and `z.registry()` APIs.
Does NOT work with Zod v3 (which uses `_def` internals).

Key concepts:
- **Processors**: Per-type handlers that extract structure from Zod schemas
- **Registry**: `z.registry<FormMeta>()` stores per-schema field config
- **Optimization**: L1 decomposes validation per-field, L2 extracts native HTML rules
- **Config presets**: `shadcn` preset maps to controlled components with field expressions

## Quick Start

```ts
import { z } from 'zod';
import { walkSchema } from '@zod-to-form/core';

const schema = z.object({
  name: z.string().min(1).describe('Your full name'),
  age: z.number().int().min(0),
  newsletter: z.boolean().default(false)
});

const fields = walkSchema(schema);

console.log(fields.map((f) => ({ key: f.key, component: f.component })));
```

## When to Use

**Use this skill when:**
- You want per-field validation instead of whole-form validation → use `createOptimizers`
- You need native HTML validation attributes (required, minLength, pattern) → use `createOptimizers`
- ALWAYS call on form values before schema.safeParse() in runtime mode → use `normalizeFormValues` — HTML inputs produce `""` for unset optional fields, which Zod rejects; this is the single mandatory normalization step
- You need direct schema-to-fields conversion in runtime contexts → use `walkSchema`
- You're building a custom codegen pipeline on top of FormField[] → use `walkSchema`
- You have a deeply-nested FieldConfig mirroring your schema shape → use `registerDeep`
- Recommended for complex schemas with nested objects and arrays → use `registerDeep`
- Merging global field configs from z2f.config.ts into a registry → use `registerFlat`
- Your config uses dot-path notation rather than nested structure → use `registerFlat`

**Do NOT use when:**
- You only need whole-schema validation — omit the optimization option entirely (`createOptimizers`)
- CLI codegen mode — generated components call normalization internally; calling it again is safe (idempotent) but redundant (`normalizeFormValues`)
- You just want generated components — use the CLI instead (`walkSchema`)
- Your schema is not z.object() at the root level (`walkSchema`)
- For simple flat configs — registerFlat() is simpler and more direct (`registerDeep`)
- Don't use if your config comes from dot-path format (CLI global fields) (`registerDeep`)
- Your config is already nested mirroring schema shape — use registerDeep() instead (`registerFlat`)

API surface: 58 functions, 26 types, 9 constants

## NEVER

- NEVER mutate builtinOptimizers — it's a module singleton. Always use createOptimizers(custom)
- NEVER assume custom optimizers append — they REPLACE the entire chain for that type
- NEVER rely on this for custom types (Date, File subclasses, etc.) — it only handles empty strings and FileList; FIX: normalize custom types before calling this function or in a custom resolver wrapper
- NEVER pass a non-object schema at the root — throws immediately
- NEVER bypass the processor registry for custom types — extend via options.processors
- NEVER skip normalizeFormValues() before schema.safeParse() — empty strings from HTML inputs fail optional field validation
- NEVER mix with registerFlat() on the same schema — registry entries conflict silently
- NEVER forget the structural keys (fields, arrayItems) for nested config — without them, child config is silently ignored
- NEVER mix with registerDeep() on the same schema — registry entries conflict silently
- NEVER assume numeric path segments matter — "items.0.name" and "items.2.name" resolve to the same target

## Configuration

10 configuration interfaces — see references/config.md for details.

## Quick Reference

**Key functions:** `canonicalizeConfig` (Serialize a CodegenConfig to a canonical string suitable for
hashing into a cache key), `createOptimizers` (Create an optimizer registry by merging custom optimizers with builtins), `createSchemaLiteCollector` (Create a new SchemaLiteCollector instance), `defineConfig` (Typed identity helper for canonical authored configuration), `validateConfig` (Validate canonical authored configuration without expanding presets), `resolveFieldConfig` (Merge global field config with per-schema field config overrides), `joinPath` (Join a parent path and a child key with a dot separator), `createBaseField` (Create a base FormField with sensible defaults), `getEmptyDefault` (Returns a type-safe empty default value for a FormField based on its zodType
and structure), `normalizeFieldKey` (Normalise a concrete field key to the bracket notation used in config), `collectFieldSections` (Collect section groupings from fields and a config override lookup), `normalizeFormValues` (Normalize raw HTML form values for Zod parsing), `getFieldRegisterHints` (Derive framework-agnostic register hints from a `FormField`), `resolveBaseProps` (Static, schema-derived base props every field's component receives, identical
across all zodTypes), `resolveNativeAttrs` (Extract DOM-valid native attributes from a field's props), `resolveControlMode` (Derive the control mode from a field mapping's component override), `resolveOptionsProps` (Extract options props from a field for enum/union select-style components), `isZodSchema` (Structural Zod v4 check shared across loader/registration/codegen entrypoints), `walkSchema` (Walk a Zod schema and produce a FormField[] tree), `createProcessors` (Create a custom processor registry by merging with built-in processors), `registerDeep` (Register a schema and all its nested fields in a registry using a
path-structured FieldConfig tree), `registerFlat` (Register flat dot-path field configs against a schema's registry), `processArray` (Process `z), `processTuple` (Process `z), `processBoolean` (Process `z), `processMap` (Process `z), `processSet` (Process `z), `processCrossRef` (Process a cross-reference field — a schema annotated in the form registry with `refType`), `processDate` (Process `z), `processEnum` (Process `z), `processLiteral` (Process `z), `processFallback` (Fallback processor for Zod types without a dedicated handler), `processFile` (Process `z), `processNumber` (Process `z), `processObject` (Process `z), `processIntersection` (Process `z), `processRecord` (Process `z), `processString` (Process `z), `processTemplateLiteral` (Process `z), `processUnion` (Process `z), `processDiscriminatedUnion` (Process `z), `processDefault` (Process `z), `processLazy` (Process `z), `processNullable` (Process `z), `processOptional` (Process `z), `processPipe` (Process `z), `processReadonly` (Process `z), `loadSchema` (Load a single named Zod schema export from a TypeScript or JavaScript
file), `loadSchemaModule` (Load a schema file and return the entire module namespace, leaving the
choice of which export to use to the caller), `resolveSchemaExportNames` (Return the sorted list of named Zod schema exports in a schema file), `loadConfig` (Load and validate a component config file (`z2f), `resolveDefaultConfigPath` (Walk the standard config-file naming candidates in `cwd` and return the
first that exists), `loadDefaultConfig` (Load and validate the default config file from `cwd` by auto-discovering
standard naming candidates (`z2f)

*93 exports total — see references/ for full API.*

## References

Load these on demand — do NOT read all at once:

- When calling any function → browse `references/functions/` for grouped indexes, full signatures, parameters, and return types
- When defining typed variables or function parameters → read `references/types.md`
- When using exported constants → read `references/variables.md`
- When configuring options → read `references/config.md` for all settings and defaults

## Links

- [Repository](https://github.com/pradeepmouli/zod-to-form)
- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
---
name: zod-to-form-core
description: "Documentation site for zod-to-form (Docusaurus 3 + TypeDoc) Use when: You want per-field validation instead of whole-form validation; You need native HTML validation attributes (required, minLength, pattern); Writing z2f.config.ts for CLI codegen (primary use case)."
---

# @zod-to-form/core

Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)

Requires Zod v4 — uses `_zod.def`, `_zod.bag`, and `z.registry()` APIs.
Does NOT work with Zod v3 (which uses `_def` internals).

Key concepts:
- **Processors**: Per-type handlers that extract structure from Zod schemas
- **Registry**: `z.registry<FormMeta>()` stores per-schema field config
- **Optimization**: L1 decomposes validation per-field, L2 extracts native HTML rules
- **Config presets**: `shadcn` preset maps to controlled components with field expressions

## When to Use


| Task | Use |
|------|-----|
| You want per-field validation instead of whole-form validation | `createOptimizers` |
| You need native HTML validation attributes (required, minLength, pattern) | `createOptimizers` |
| Writing z2f.config.ts for CLI codegen (primary use case) | `defineConfig` |
| You want TypeScript inference and IDE autocompletion for config | `defineConfig` |
| Loading config from JSON files or dynamic import() | `validateConfig` |
| You need runtime validation of user-provided config | `validateConfig` |
| ALWAYS call on form values before schema.safeParse() in runtime mode | `normalizeFormValues` |
| Critical for optional fields where HTML produces "" but Zod expects undefined | `normalizeFormValues` |
| You need direct schema-to-fields conversion in runtime contexts | `walkSchema` |
| You're building a custom codegen pipeline on top of FormField[] | `walkSchema` |
| You have a deeply-nested FieldConfig mirroring your schema shape | `registerDeep` |
| Recommended for complex schemas with nested objects and arrays | `registerDeep` |
| Merging global field configs from z2f.config.ts into a registry | `registerFlat` |
| Your config uses dot-path notation rather than nested structure | `registerFlat` |

**Avoid when:**

| Don't Use | When | Use Instead |
|-----------|------|-------------|
| `createOptimizers` | You only need whole-schema validation | omit the optimization option entirely |
| `defineConfig` | Runtime-only usage where you pass config inline to walkSchema | — |
| `validateConfig` | Using TypeScript with defineConfig() | type errors catch most issues at dev time |
| `normalizeFormValues` | CLI codegen mode | generated components handle normalization internally |
| `normalizeFormValues` | Your form library already normalizes (but calling it anyway is safe | it's idempotent) |
| `walkSchema` | You just want generated components | use the CLI instead |
| `walkSchema` | Your schema is not z.object() at the root level | — |
| `registerDeep` | For simple flat configs | registerFlat() is simpler and more direct |
| `registerDeep` | Don't use if your config comes from dot-path format (CLI global fields) | — |
| `registerFlat` | Your config is already nested mirroring schema shape | use registerDeep() instead |
- API surface: 43 functions, 20 types, 4 constants

## Pitfalls

- NEVER mutate builtinOptimizers — it's a module singleton. Always use createOptimizers(custom)
- NEVER assume custom optimizers append — they REPLACE the entire chain for that type
- NEVER assume preset props merge with your props — the entire props dict is replaced. If you set component props, you must include ALL props including the ones from the preset
- NEVER use as a type guard — it throws on invalid input, doesn't narrow
- NEVER assume extra keys cause failures — the schema uses z.object().loose(), extra keys are silently ignored
- NEVER skip this in runtime mode — optional fields will fail validation with "expected string, received string" errors that are extremely confusing to debug
- NEVER rely on it for custom types (Date, etc.) — only handles strings and FileList
- NEVER pass a non-object schema at the root — throws immediately
- NEVER bypass the processor registry for custom types — extend via options.processors
- NEVER skip normalizeFormValues() before schema.safeParse() — empty strings from HTML inputs fail optional field validation
- NEVER mix with registerFlat() on the same schema — registry entries conflict silently
- NEVER forget the structural keys (fields, arrayItems) for nested config — without them, child config is silently ignored
- NEVER mix with registerDeep() on the same schema — registry entries conflict silently
- NEVER assume numeric path segments matter — "items.0.name" and "items.2.name" resolve to the same target

## Configuration

8 configuration interfaces — see references/config.md for details.

## Quick Reference

**Configuration:** `canonicalizeConfig` (Serialize a CodegenConfig to a canonical string suitable for
hashing into a cache key), `defineConfig` (Identity helper that returns its argument typed as `ZodFormsConfig`), `validateConfig` (Validates an unknown value as a `ZodFormsConfig` at runtime), `resolveFieldConfig` (Merge global field config with per-schema field config overrides), `normalizeConfig` (Normalize a validated config by migrating deprecated top-level fields to their canonical locations), `ComponentPreset` (Preset name for built-in component library mappings), `ConfigDefaults` (Default generation settings applied to all schemas unless overridden per-schema)
**Optimization:** `createOptimizers` (Create an optimizer registry by merging custom optimizers with builtins), `createSchemaLiteCollector` (Create a new SchemaLiteCollector instance), `FormOptimizer` (An optimizer function that mutates a `FormField` after the processor has run), `FormOptimizerContext` (Context shared across all optimizers during a `walkSchema` run), `SchemaLiteCollector` (Mutable accumulator that builds a lite Zod schema for submit-time validation), `builtinOptimizers` (The default optimizer registry — L1 (decompose) + L2 (native rules) chains merged per type)
**utils:** `inferLabel` (Convert a camelCase or snake_case key to a human-readable Title Case label)
**Utils:** `joinPath` (Join a parent path and a child key with a dot separator), `createBaseField` (Create a base FormField with sensible defaults), `getEmptyDefault` (Returns a type-safe empty default value for a FormField based on its zodType
and structure), `normalizeFieldKey` (Normalise a concrete field key to the bracket notation used in config), `collectFieldSections` (Collect section groupings from fields and a config override lookup)
**Normalization:** `normalizeFormValues` (Normalize raw HTML form values for Zod parsing)
**Schema Walking:** `walkSchema` (Walk a Zod schema and produce a FormField[] tree), `WalkResult` (The result returned by `walkSchema()` when an optimization level is specified)
**Registry:** `createProcessors` (Create a custom processor registry by merging with built-in processors), `builtinProcessors` (The default processor registry — maps every Zod v4 `def)
**Registration:** `registerDeep` (Register a schema and all its nested fields in a registry using a
path-structured FieldConfig tree), `registerFlat` (Register flat dot-path field configs against a schema's registry)
**Processors:** `processArray` (Process `z), `processTuple` (Process `z), `processBoolean` (Process `z), `processMap` (Process `z), `processSet` (Process `z), `processCrossRef` (Process a cross-reference field — a schema annotated in the form registry with `refType`), `processDate` (Process `z), `processEnum` (Process `z), `processLiteral` (Process `z), `processFallback` (Fallback processor for Zod types without a dedicated handler), `processFile` (Process `z), `processNumber` (Process `z), `processObject` (Process `z), `processIntersection` (Process `z), `processRecord` (Process `z), `processString` (Process `z), `processTemplateLiteral` (Process `z), `processUnion` (Process `z), `processDiscriminatedUnion` (Process `z), `processDefault` (Process `z), `processLazy` (Process `z), `processNullable` (Process `z), `processOptional` (Process `z), `processPipe` (Process `z), `processReadonly` (Process `z)
**Types:** `FormField` (Intermediate representation of a single form field produced by `walkSchema`), `FormFieldOption` (An individual option in a Select, RadioGroup, or similar enum-driven component), `FormFieldConstraints` (Structural constraints extracted from Zod's `_zod), `FormProcessor` (A processor function that mutates a `FormField` in-place based on the Zod schema it handles), `FormProcessorContext` (Runtime context passed to every processor during a walkSchema traversal), `FormMeta` (Per-schema annotation stored in a `z), `ProcessParams` (Optional parameters passed to each processor alongside the schema, context, and field), `NativeRules` (Native HTML and RHF validation rules extracted from Zod constraints), `ValidationStrategy` (Specifies how a field's validation is handled at submit and change time)
**types:** `FieldExpression` (Known RHF field expression strings that can be used as values in `props`), `ZodFormRegistry` (Zod v4 registry parameterized with FormMeta)
**config:** `ComponentOverride` (Per-component metadata override), `StripIndexSignature` (Strips index signatures from a type, keeping only explicitly declared keys), `SHADCN_OVERRIDES` (shadcn preset — Radix-based components need controlled mo...), `DEFAULT_OVERRIDES` (Default HTML preset — no controlled components by default)
**optimizers:** `SchemaLiteInfo` (Metadata for codegen to reconstruct the lite schema in a...)

## References

Load these on demand — do NOT read all at once:

- When calling any function → read `references/functions.md` for full signatures, parameters, and return types
- When defining typed variables or function parameters → read `references/types.md`
- When using exported constants → read `references/variables.md`
- When configuring options → read `references/config.md` for all settings and defaults

## Links

- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
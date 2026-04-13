---
name: zod-to-form-core
description: "Schema-Driven Form Generation for Zod v4 - walks Zod internal type tree using processor registry pattern to emit React form components instead of JSON Schema Use when working with zod, forms, form-generation, schema, codegen, react, validation, ui, components."
license: MIT
---

# @zod-to-form/core

Schema-Driven Form Generation for Zod v4 - walks Zod internal type tree using processor registry pattern to emit React form components instead of JSON Schema

## When to Use

- Working with zod, forms, form-generation, schema, codegen, react, validation, ui, components
- You want per-field validation instead of whole-form validation
- You need native HTML validation attributes (required, minLength, pattern)
- Writing z2f.config.ts for CLI codegen (primary use case)
- You want TypeScript inference and IDE autocompletion for config
- Loading config from JSON files or dynamic import()
- You need runtime validation of user-provided config
- ALWAYS call on form values before schema.safeParse() in runtime mode
- Critical for optional fields where HTML produces "" but Zod expects undefined
- You need direct schema-to-fields conversion in runtime contexts
- You're building a custom codegen pipeline on top of FormField[]
- You have a deeply-nested FieldConfig mirroring your schema shape
- Recommended for complex schemas with nested objects and arrays
- Merging global field configs from z2f.config.ts into a registry
- Your config uses dot-path notation rather than nested structure

**Avoid when:**
- You only need whole-schema validation — omit the optimization option entirely
- Runtime-only usage where you pass config inline to walkSchema
- Using TypeScript with defineConfig() — type errors catch most issues at dev time
- CLI codegen mode — generated components handle normalization internally
- Your form library already normalizes (but calling it anyway is safe — it's idempotent)
- You just want generated components — use the CLI instead
- Your schema is not z.object() at the root level
- For simple flat configs — registerFlat() is simpler and more direct
- Don't use if your config comes from dot-path format (CLI global fields)
- Your config is already nested mirroring schema shape — use registerDeep() instead
- API surface: 42 functions, 26 types, 4 constants

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

### WalkOptions

| Key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `formRegistry` | `ZodFormRegistry` | no | — | Custom form registry for metadata annotations |
| `processors` | `Record<string, FormProcessor<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>>` | no | — | Custom processors to add or override built-in ones |
| `maxDepth` | `number` | no | — | Maximum recursion depth for lazy/recursive schemas (default: 5) |
| `optimization` | `{ level: 1 | 2 | 3; optimizers?: Record<string, FormOptimizer[]> }` | no | — | Validation optimization settings.

This is the walker's API surface — callers (useZodForm, CLI codegen) pass
the optimization config here. The CLI reads `config.defaults.optimization`
and forwards it; useZodForm accepts it via its own options. Both converge
here as the single source of truth for the walker. |

## Quick Reference

**Optimization:** `createOptimizers`
**schema-lite:** `createSchemaLiteCollector`
**Configuration:** `defineConfig`, `validateConfig`, `ComponentsConfig`, `ZodFormsConfig`
**config:** `resolveFieldConfig`, `normalizeConfig`, `ComponentOverride`, `ComponentPreset`, `TypedFieldConfig`, `ZodTypeConfig`, `ConfigDefaults`, `OptimizationConfig`, `StripIndexSignature`, `SHADCN_OVERRIDES`, `DEFAULT_OVERRIDES`
**utils:** `inferLabel`, `joinPath`, `createBaseField`, `getEmptyDefault`, `normalizeFieldKey`, `collectFieldSections`
**Normalization:** `normalizeFormValues`
**Schema Walking:** `walkSchema`
**registry:** `createProcessors`, `builtinProcessors`
**Registration:** `registerDeep`, `registerFlat`
**array:** `processArray`, `processTuple`
**boolean:** `processBoolean`
**collections:** `processMap`, `processSet`
**cross-ref:** `processCrossRef`
**date:** `processDate`
**enum:** `processEnum`, `processLiteral`
**fallback:** `processFallback`
**file:** `processFile`
**number:** `processNumber`
**object:** `processObject`, `processIntersection`
**record:** `processRecord`
**string:** `processString`, `processTemplateLiteral`
**union:** `processUnion`, `processDiscriminatedUnion`
**wrappers:** `processDefault`, `processLazy`, `processNullable`, `processOptional`, `processPipe`, `processReadonly`
**Types:** `FormField`, `FormProcessor`, `FormMeta`, `FieldConfig`
**types:** `FormFieldOption`, `FormFieldConstraints`, `FormProcessorContext`, `FieldExpression`, `ProcessParams`, `ZodFormRegistry`, `NativeRules`, `ValidationStrategy`, `FormOptimizer`, `FormOptimizerContext`, `WalkResult`, `SchemaLiteCollector`, `SchemaLiteInfo`
`builtinOptimizers`

## Links

- [Repository](https://github.com/pradeepmouli/zod-to-form)
- Author: Pradeep Mouli <noreply@anthropic.com>
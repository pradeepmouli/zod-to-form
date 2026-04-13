---
name: zod-to-form-react
description: "Schema-Driven Form Generation for Zod v4 - walks Zod internal type tree using processor registry pattern to emit React form components instead of JSON Schema Use when working with zod, forms, form-generation, schema, codegen, react, validation, ui, components."
license: MIT
---

# @zod-to-form/react

Schema-Driven Form Generation for Zod v4 - walks Zod internal type tree using processor registry pattern to emit React form components instead of JSON Schema

## When to Use

- Working with zod, forms, form-generation, schema, codegen, react, validation, ui, components
- ALWAYS call on form values before schema.safeParse() in runtime mode
- Critical for optional fields where HTML produces "" but Zod expects undefined

**Avoid when:**
- CLI codegen mode — generated components handle normalization internally
- Your form library already normalizes (but calling it anyway is safe — it's idempotent)
- API surface: 4 functions, 7 types, 3 constants

## Pitfalls

- NEVER skip this in runtime mode — optional fields will fail validation with "expected string, received string" errors that are extremely confusing to debug
- NEVER rely on it for custom types (Date, etc.) — only handles strings and FileList

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

**ZodForm:** `ZodForm`
**useZodForm:** `useZodForm`
**Normalization:** `normalizeFormValues`
**SchemaLiteSubmit:** `wrapWithSchemaLite`
**Types:** `FormField`, `FormMeta`, `FieldConfig`
**types.d:** `FormFieldOption`, `FormFieldConstraints`
**FieldRenderer:** `RuntimeComponentConfig`, `FieldTemplateProps`
`defaultComponentMap`, `FIELD_COMPONENT_NAMES`, `shadcnComponentMap`

## Links

- [Repository](https://github.com/pradeepmouli/zod-to-form)
- Author: Pradeep Mouli <noreply@anthropic.com>
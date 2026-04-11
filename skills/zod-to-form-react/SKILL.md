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
- API surface: 4 functions, 8 types, 3 constants

## Pitfalls

- NEVER skip this in runtime mode — optional fields will fail validation with "expected string, received string" errors that are extremely confusing to debug
- NEVER rely on it for custom types (Date, etc.) — only handles strings and FileList

## Quick Reference

**ZodForm:** `ZodForm`
**useZodForm:** `useZodForm`
**Normalization:** `normalizeFormValues`
**SchemaLiteSubmit:** `wrapWithSchemaLite`
**Types:** `FormField`, `FormMeta`, `FieldConfig`
**types.d:** `FormFieldOption`, `FormFieldConstraints`
**Schema Walking:** `WalkOptions`
**FieldRenderer:** `RuntimeComponentConfig`, `FieldTemplateProps`
`defaultComponentMap`, `FIELD_COMPONENT_NAMES`, `shadcnComponentMap`

## Links

- [Repository](https://github.com/pradeepmouli/zod-to-form)
- Author: Pradeep Mouli <noreply@anthropic.com>
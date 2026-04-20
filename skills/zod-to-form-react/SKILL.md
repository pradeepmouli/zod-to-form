---
name: zod-to-form-react
description: "Runtime <ZodForm> renderer for Zod v4 schemas Use when working with zod, zod-v4, react, forms, form-generation, react-hook-form, schema-driven, dynamic-forms, form-renderer, hookform-resolver, zod-form-renderer."
license: MIT
---

# @zod-to-form/react

Runtime <ZodForm> renderer for Zod v4 schemas

## Quick Start

```tsx
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subscribe: z.boolean().default(false)
});

export function UserForm() {
  return (
    <ZodForm
      schema={userSchema}
      mode='onSubmit'
      onSubmit={(data) => {
        console.log('submitted', data);
      }}
    >
      <button type='submit'>Save</button>
    </ZodForm>
  );
}
```

## When to Use

- Working with zod, zod-v4, react, forms, form-generation, react-hook-form, schema-driven, dynamic-forms, form-renderer, hookform-resolver, zod-form-renderer

| Task | Use | Why |
|------|-----|-----|
| You want a zero-config form from a Zod v4 schema at runtime, no build step | `ZodForm` | — |
| You need form rendering in storybook, playgrounds, or low-traffic admin UIs | `ZodForm` | — |
| You are prototyping before committing to CLI codegen | `ZodForm` | — |
| You need direct access to the RHF `form` instance (e.g. to call `form.setValue`) | `useZodForm` | — |
| You are building a custom renderer on top of `FormField[]` | `useZodForm` | — |
| You want to colocate form state management with your own layout logic | `useZodForm` | — |
| ALWAYS call on form values before schema.safeParse() in runtime mode | `normalizeFormValues` | — |
| Critical for optional fields where HTML produces "" but Zod expects undefined | `normalizeFormValues` | — |
| You are using a codegen output with `validationLevel: 1` or higher (schema-lite mode) | `wrapWithSchemaLite` | — |
| You need to map server validation errors back to form fields via RHF's `setError` | `wrapWithSchemaLite` | — |

**Avoid when:**

| Don't Use | When | Use Instead |
|-----------|------|-------------|
| `ZodForm` | Bundle size is critical | use CLI codegen (`@zod-to-form/cli`) instead for |
| `ZodForm` | production; runtime schema walking adds tree-size overhead | — |
| `ZodForm` | You need forms for complex schemas with cyclic references | the walker does |
| `ZodForm` | not handle cycles and will hit the max-depth guard silently | — |
| `ZodForm` | You are on Zod v3 | the schema walker requires Zod v4's `_zod` internals |
| `useZodForm` | You just need a working form UI | use `<ZodForm>` instead, which handles rendering |
| `useZodForm` | You are on Zod v3 | the hook requires Zod v4 schema internals |
| `normalizeFormValues` | CLI codegen mode | generated components handle normalization internally |
| `normalizeFormValues` | Your form library already normalizes (but calling it anyway is safe | it's idempotent) |
| `wrapWithSchemaLite` | You are using the default `zodResolver` path (no `validationLevel`) | validation |
| `wrapWithSchemaLite` | is handled by RHF's resolver and this wrapper is redundant | — |
| `wrapWithSchemaLite` | Your schema has cross-field refinements in the lite schema | the lite schema |
| `wrapWithSchemaLite` | intentionally strips root-level refinements, so cross-field rules are NOT checked | — |
- API surface: 4 functions, 5 types, 3 constants

## Pitfalls

- NEVER pass `componentConfig` without a matching `components` map that covers
- the component names referenced — missing components are silently dropped at
- render time with no console error
- NEVER change the `schema` object identity on every render — `walkSchema` runs
- inside `useMemo` keyed on schema identity, so unstable schema references cause
- full re-walks on each render
- NEVER expect controlled component prop expressions (e.g. `field.value`) to
- work without a `propMap` in `componentConfig` — uncontrolled mode is the
- default; controlled mode requires explicit opt-in via field config
- NEVER pass a new schema object on every render — `walkSchema` is memoized by schema
- identity; an unstable reference causes re-walking on every render cycle
- NEVER forget `normalizeFormValues()` before manually calling `schema.safeParse()` —
- the hook's internal resolver applies normalization, but manual calls do not
- NEVER mix `formRegistry` and `fields` options on the same call — when `formRegistry`
- is provided, `fields` is ignored entirely (no merge, no warning)
- NEVER skip this in runtime mode — optional fields will fail validation with "expected string, received string" errors that are extremely confusing to debug
- NEVER rely on it for custom types (Date, etc.) — only handles strings and FileList
- NEVER pass the full schema as `schemaLite` — it defeats the optimization and adds
- double-validation overhead; only pass the schema produced by `walkSchema`'s
- `result.schemaLite` field
- NEVER use this with schemas that have root-level `.superRefine()` — root refinements
- are stripped from `schemaLite` by design and will not run through this wrapper

## Configuration

3 configuration interfaces — see references/config.md for details.

## Quick Reference

**Components:** `ZodForm` (Runtime React component that renders a type-safe form from a Zod v4 schema), `defaultComponentMap` (The default HTML-based component map used by `<ZodForm>` and `<FieldRenderer>`), `shadcnComponentMap` (Component map pre-wired with shadcn/ui-styled implementations)
**Hooks:** `useZodForm` (React Hook Form integration hook for Zod v4 schemas)
**Normalization:** `normalizeFormValues` (Normalize raw HTML form values for Zod parsing)
**Optimization:** `wrapWithSchemaLite` (Wraps a form `onSubmit` handler with `schemaLite` client-side validation)
**Types:** `FormField` (Intermediate representation of a single form field produced by `walkSchema`), `FormFieldOption` (An individual option in a Select, RadioGroup, or similar enum-driven component), `FormFieldConstraints` (Structural constraints extracted from Zod's `_zod), `FormMeta` (Per-schema annotation stored in a `z), `FieldTemplateProps` (Props passed to the field template component that wraps each rendered form field)
**components:** `FIELD_COMPONENT_NAMES` (User-facing field component names derived from defaultCom...)

## Links

- [Repository](https://github.com/pradeepmouli/zod-to-form)
- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
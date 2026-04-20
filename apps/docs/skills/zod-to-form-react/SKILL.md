---
name: zod-to-form-react
description: "Documentation site for zod-to-form (Docusaurus 3 + TypeDoc) Runtime React renderer for Zod v4 form schemas — wraps react-hook-form with a schema walker that maps Zod types to form components. Use when: You want a zero-config form from a Zod v4 schema at runtime, no build step; You need form rendering in storybook, playgrounds, or low-traffic admin UIs; You are prototyping before committing to CLI codegen."
---

# @zod-to-form/react

Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)

Choose your abstraction level: `<ZodForm>` for zero-config, `useZodForm` for custom
rendering, manual `walkSchema` for full control. Each step down trades convenience for
flexibility.

## When to Use


| Task | Use |
|------|-----|
| You want a zero-config form from a Zod v4 schema at runtime, no build step | `ZodForm` |
| You need form rendering in storybook, playgrounds, or low-traffic admin UIs | `ZodForm` |
| You are prototyping before committing to CLI codegen | `ZodForm` |
| You need direct access to the RHF `form` instance (e.g. to call `form.setValue`) | `useZodForm` |
| You are building a custom renderer on top of `FormField[]` | `useZodForm` |
| You want to colocate form state management with your own layout logic | `useZodForm` |
| You are using a codegen output with `validationLevel: 1` or higher (schema-lite mode) | `wrapWithSchemaLite` |
| You need to map server validation errors back to form fields via RHF's `setError` | `wrapWithSchemaLite` |

**Avoid when:**

| Don't Use | When | Use Instead |
|-----------|------|-------------|
| `ZodForm` | Bundle size is critical | use CLI codegen (`@zod-to-form/cli`) instead for production; runtime schema walking adds tree-size overhead |
| `ZodForm` | You need forms for complex schemas with cyclic references | the walker does not handle cycles and will hit the max-depth guard silently |
| `ZodForm` | You are on Zod v3 | the schema walker requires Zod v4's `_zod` internals |
| `useZodForm` | You just need a working form UI | use `<ZodForm>` instead, which handles rendering |
| `useZodForm` | You are on Zod v3 | the hook requires Zod v4 schema internals |
| `wrapWithSchemaLite` | You are using the default `zodResolver` path (no `validationLevel`) | validation is handled by RHF's resolver and this wrapper is redundant |
| `wrapWithSchemaLite` | Your schema has cross-field refinements in the lite schema | the lite schema intentionally strips root-level refinements, so cross-field rules are NOT checked |
- API surface: 3 functions, 5 types, 3 constants

## Pitfalls

- NEVER pass `componentConfig` without a matching `components` map that covers the component names referenced — missing components are silently dropped at render time with no console error
- NEVER expect controlled component prop expressions (e.g. `field.value`) to work without a `propMap` in `componentConfig` — uncontrolled mode is the default; controlled mode requires explicit opt-in via field config

## Configuration

3 configuration interfaces — see references/config.md for details.

## Quick Reference

**Components:** `ZodForm` (Runtime React component that renders a type-safe form from a Zod v4 schema), `defaultComponentMap` (The default HTML-based component map used by `<ZodForm>` and `<FieldRenderer>`), `shadcnComponentMap` (Component map pre-wired with shadcn/ui-styled implementations)
**Hooks:** `useZodForm` (React Hook Form integration hook for Zod v4 schemas)
**Optimization:** `wrapWithSchemaLite` (Wraps a form `onSubmit` handler with `schemaLite` client-side validation)
**Types:** `FormField` (Intermediate representation of a single form field produced by `walkSchema`), `FormFieldOption` (An individual option in a Select, RadioGroup, or similar enum-driven component), `FormFieldConstraints` (Structural constraints extracted from Zod's `_zod), `FormMeta` (Per-schema annotation stored in a `z), `FieldTemplateProps` (Props passed to the field template component that wraps each rendered form field)
**components:** `FIELD_COMPONENT_NAMES` (User-facing field component names derived from defaultCom...)

## References

Load these on demand — do NOT read all at once:

- When calling any function → read `references/functions.md` for full signatures, parameters, and return types
- When defining typed variables or function parameters → read `references/types.md`
- When using exported constants → read `references/variables.md`
- When configuring options → read `references/config.md` for all settings and defaults

## Links

- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
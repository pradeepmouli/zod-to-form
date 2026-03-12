---
"@zod-to-form/core": minor
"@zod-to-form/cli": minor
"@zod-to-form/react": minor
---

feat: controlled component support, FormProvider wrapping, and form scaffolding improvements

**Core:**
- Add `controlled` and `propMap` to `ComponentEntry` for marking components as controlled
- Add `propMap` to `FieldConfig` for per-field prop mapping overrides
- Add `formProvider` to `ConfigDefaults`
- Export `StripIndexSignature` utility type (eliminates inline boilerplate in generated files)
- Export `getEmptyDefault()` for schema-inferred type-safe empty values

**CLI:**
- Generate `<Controller>` pattern for `controlled: true` components with `propMap` support
- Always emit `const form = useForm(...)` then destructure (enables FormProvider and reset)
- Wrap form in `<FormProvider {...form}>` when `formProvider: true` or `mode: 'auto-save'`
- Accept `defaultValues` and `values` props for external data population
- Import `StripIndexSignature` from `@zod-to-form/core` instead of inlining
- Use `getEmptyDefault()` for type-safe array append defaults

**React:**
- Add `useController` support for controlled components in `FieldRenderer`
- Apply `propMap` (component-level + per-field override) to remap RHF field props
- Pass `values` prop through to `useForm({ values })` in `useZodForm`
- Use shared `getEmptyDefault()` for array append defaults

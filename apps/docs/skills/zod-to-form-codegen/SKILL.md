---
name: zod-to-form-codegen
description: "Documentation site for zod-to-form (Docusaurus 3 + TypeDoc) Browser-safe code generation utilities for Zod v4 form components. Use when: Building a custom codegen pipeline that assembles `FormField[]` and needs the TSX string; Writing codegen tests that verify output structure without spawning a CLI process; Building a custom codegen backend that needs the same override resolution logic as the CLI."
---

# @zod-to-form/codegen

Documentation site for zod-to-form (Docusaurus 3 + TypeDoc)

## When to Use


| Task | Use |
|------|-----|
| Building a custom codegen pipeline that assembles `FormField[]` and needs the TSX string | `generateFormComponent` |
| Writing codegen tests that verify output structure without spawning a CLI process | `generateFormComponent` |
| Building a custom codegen backend that needs the same override resolution logic as the CLI | `resolveFieldMapping` |
| Writing tests that verify field-to-component mapping for a given config | `resolveFieldMapping` |

**Avoid when:**

| Don't Use | When | Use Instead |
|-----------|------|-------------|
| `generateFormComponent` | You want file-writing behavior | use `runGenerate()` from `@zod-to-form/cli` instead |
| `generateFormComponent` | You are using the Vite plugin | `compileTarget` wraps this and handles esbuild transformation |
| `resolveFieldMapping` | You are using the CLI or Vite plugin | this is called internally and you don't need it |
- API surface: 8 functions, 1 constants

## Pitfalls

- NEVER call `generateFormComponent` with a stale `fields` array from a previous schema version — there is no cache invalidation; callers must re-run `walkSchema` on schema change
- NEVER use the returned string as a module cache key — it is not content-addressed; use `configHash` from `@zod-to-form/core` on the config object instead
- NEVER assume `source: 'none'` means the field has no component — the schema walker may have inferred one; `resolveFieldMapping` only resolves user-provided config overrides

## Configuration

2 configuration interfaces — see references/config.md for details.

## Quick Reference

**Codegen:** `generateFormComponent` (Generate a React form component as a TypeScript string from `FormField[]`), `resolveFieldMapping` (Resolve the component name and override config for a single `FormField` key)
**Templates:** `getFileHeader` (Generate the import block for a form component file), `renderField` (Render a single `FormField` to its plain-HTML JSX string), `registerPathExpr` (Produce the correct `register(), `generateSchemaLiteFile` (Generate the content of a `), `getFieldTemplateSource` (Return the source code for the preset's `FieldTemplate` React component)
**Config Templates:** `buildConfigSource` (Generate a `z2f)
**field-templates:** `PRESET_TEMPLATE_IMPORTS` (Components that each preset's field template imports from...)

## References

Load these on demand — do NOT read all at once:

- When calling any function → read `references/functions.md` for full signatures, parameters, and return types
- When using exported constants → read `references/variables.md`
- When configuring options → read `references/config.md` for all settings and defaults

## Links

- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
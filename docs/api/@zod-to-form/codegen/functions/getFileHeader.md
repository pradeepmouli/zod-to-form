[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / getFileHeader

# Function: getFileHeader()

> **getFileHeader**(`schemaImportPath`, `exportName`, `hasArrays?`, `mode?`, `componentImportLine?`, `options?`, `optimized?`): `string`

Defined in: [codegen/src/templates.ts:100](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/codegen/src/templates.ts#L100)

Generate the import block for a form component file.
Emits react-hook-form, zodResolver, zod, and component import lines
based on the generation options. Also inlines the `StripIndexSignature` utility type
and the `normalizeFormValues` helper for html-preset forms.

## Parameters

### schemaImportPath

`string`

Module specifier for the schema file (e.g. `'./schema'`).

### exportName

`string`

The named schema export to import (e.g. `'UserSchema'`).

### hasArrays?

`boolean` = `false`

Whether to include `useFieldArray` in the RHF import.

### mode?

`"submit"` \| `"auto-save"`

Form submission mode: `'submit'` (default) or `'auto-save'`.

### componentImportLine?

`string`

Optional custom import line for the component module.

### options?

Additional flags: `hasControlled`, `formProvider`, `preset`.

#### formProvider?

`boolean`

#### hasControlled?

`boolean`

#### preset?

`"shadcn"` \| `"html"`

### optimized?

Whether to conditionally include `zodResolver` and `zod` imports.

#### includeZod

`boolean`

#### includeZodResolver

`boolean`

## Returns

`string`

The complete import block as a multi-line string.

## Remarks

The `optimized` parameter controls whether the zodResolver and zod imports are included.
When optimization eliminates the need for zodResolver (all fields use native or per-field validation),
both can be omitted to reduce bundle size. The `hasControlled` flag adds `Controller` to RHF imports.

## Example

```ts
const header = getFileHeader('./schema', 'UserSchema', false, 'submit', undefined, { preset: 'shadcn' });
// → "import { useForm } from 'react-hook-form';\nimport { zodResolver } ..."
```

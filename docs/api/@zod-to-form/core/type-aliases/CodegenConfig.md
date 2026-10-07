[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / CodegenConfig

# Type Alias: CodegenConfig

> **CodegenConfig** = `object`

Defined in: config-types.ts:13

## Properties

### componentConfig?

> `optional` **componentConfig?**: [`ZodFormsConfig`](ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: config-types.ts:23

***

### componentName

> **componentName**: `string`

Defined in: config-types.ts:21

***

### exportName

> **exportName**: `string`

Defined in: config-types.ts:20

***

### formProvider?

> `optional` **formProvider?**: `boolean`

Defined in: config-types.ts:28

Force FormProvider wrapper in submit mode. Auto-save mode always uses FormProvider regardless.

***

### mode

> **mode**: `"submit"` \| `"auto-save"`

Defined in: config-types.ts:22

***

### optimization?

> `optional` **optimization?**: [`OptimizationConfig`](OptimizationConfig.md)

Defined in: config-types.ts:30

Validation optimization level. When set, generated code uses per-field validation instead of zodResolver.

***

### outputPath?

> `optional` **outputPath?**: `string`

Defined in: config-types.ts:36

Output path of the form component — used to compute the .lite.ts import path

***

### schemaImportPath?

> `optional` **schemaImportPath?**: `string`

Defined in: config-types.ts:19

Optional pre-computed import path for the schema (e.g., `./schema.js`).
Defaults to `./schema`. The CLI typically computes this from file paths;
the browser playground and Vite plugin can pass it explicitly.

***

### schemaLite?

> `optional` **schemaLite?**: `$ZodType` \| `null`

Defined in: config-types.ts:32

SchemaLite for submit-time validation of top-level effects (null when no effects exist)

***

### schemaLiteInfo?

> `optional` **schemaLiteInfo?**: [`SchemaLiteInfo`](SchemaLiteInfo.md)

Defined in: config-types.ts:34

Codegen metadata for generating the .lite.ts file

***

### ~~serverAction?~~

> `optional` **serverAction?**: `boolean`

Defined in: config-types.ts:26

#### Deprecated

Currently unused. Reserved for future server action codegen support.

***

### typesModule?

> `optional` **typesModule?**: `string`

Defined in: config-types.ts:43

When set, codegen emits `import type { StripIndexSignature } from '<typesModule>'`
and omits the inline `StripIndexSignature` type block.
When absent (default), the type is inlined for a self-contained single-file output.
The shadcn registry sets this to `'@/components/z2f'`.

***

### ui

> **ui**: `"shadcn"` \| `"html"`

Defined in: config-types.ts:24

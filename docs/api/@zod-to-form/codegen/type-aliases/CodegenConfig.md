[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / CodegenConfig

# Type Alias: CodegenConfig

> **CodegenConfig** = `object`

Defined in: [generate.ts:12](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L12)

## Properties

### componentConfig?

> `optional` **componentConfig?**: [`ZodFormsConfig`](../../cli/type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: [generate.ts:18](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L18)

***

### componentName

> **componentName**: `string`

Defined in: [generate.ts:16](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L16)

***

### exportName

> **exportName**: `string`

Defined in: [generate.ts:15](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L15)

***

### formProvider?

> `optional` **formProvider?**: `boolean`

Defined in: [generate.ts:23](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L23)

Force FormProvider wrapper in submit mode. Auto-save mode always uses FormProvider regardless.

***

### mode

> **mode**: `"submit"` \| `"auto-save"`

Defined in: [generate.ts:17](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L17)

***

### outputPath?

> `optional` **outputPath?**: `string`

Defined in: [generate.ts:31](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L31)

Output path of the form component — used to compute the .lite.ts import path

***

### schemaImportPath?

> `optional` **schemaImportPath?**: `string`

Defined in: [generate.ts:14](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L14)

Optional pre-computed import path for the schema (e.g., './schema.js'). Defaults to './schema'. The CLI typically computes this from file paths; the browser playground can pass it explicitly.

***

### schemaLite?

> `optional` **schemaLite?**: `$ZodType` \| `null`

Defined in: [generate.ts:27](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L27)

SchemaLite for submit-time validation of top-level effects (null when no effects exist)

***

### schemaLiteInfo?

> `optional` **schemaLiteInfo?**: [`SchemaLiteInfo`](../../core/type-aliases/SchemaLiteInfo.md)

Defined in: [generate.ts:29](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L29)

Codegen metadata for generating the .lite.ts file

***

### ~~serverAction?~~

> `optional` **serverAction?**: `boolean`

Defined in: [generate.ts:21](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L21)

#### Deprecated

Currently unused. Reserved for future server action codegen support.

***

### ui

> **ui**: `"shadcn"` \| `"html"`

Defined in: [generate.ts:19](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L19)

***

### validationLevel?

> `optional` **validationLevel?**: `1` \| `2` \| `3`

Defined in: [generate.ts:25](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/generate.ts#L25)

Validation optimization level. When set, generated code uses per-field validation instead of zodResolver.

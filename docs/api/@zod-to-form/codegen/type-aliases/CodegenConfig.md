[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / CodegenConfig

# Type Alias: CodegenConfig

> **CodegenConfig** = `object`

Defined in: core/dist/config-types.d.ts:12

## Properties

### componentConfig?

> `optional` **componentConfig?**: [`ZodFormsConfig`](../../cli/type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: core/dist/config-types.d.ts:22

***

### componentName

> **componentName**: `string`

Defined in: core/dist/config-types.d.ts:20

***

### exportName

> **exportName**: `string`

Defined in: core/dist/config-types.d.ts:19

***

### formProvider?

> `optional` **formProvider?**: `boolean`

Defined in: core/dist/config-types.d.ts:27

Force FormProvider wrapper in submit mode. Auto-save mode always uses FormProvider regardless.

***

### mode

> **mode**: `"submit"` \| `"auto-save"`

Defined in: core/dist/config-types.d.ts:21

***

### outputPath?

> `optional` **outputPath?**: `string`

Defined in: core/dist/config-types.d.ts:35

Output path of the form component — used to compute the .lite.ts import path

***

### schemaImportPath?

> `optional` **schemaImportPath?**: `string`

Defined in: core/dist/config-types.d.ts:18

Optional pre-computed import path for the schema (e.g., `./schema.js`).
Defaults to `./schema`. The CLI typically computes this from file paths;
the browser playground and Vite plugin can pass it explicitly.

***

### schemaLite?

> `optional` **schemaLite?**: `$ZodType` \| `null`

Defined in: core/dist/config-types.d.ts:31

SchemaLite for submit-time validation of top-level effects (null when no effects exist)

***

### schemaLiteInfo?

> `optional` **schemaLiteInfo?**: [`SchemaLiteInfo`](../../core/type-aliases/SchemaLiteInfo.md)

Defined in: core/dist/config-types.d.ts:33

Codegen metadata for generating the .lite.ts file

***

### ~~serverAction?~~

> `optional` **serverAction?**: `boolean`

Defined in: core/dist/config-types.d.ts:25

#### Deprecated

Currently unused. Reserved for future server action codegen support.

***

### ui

> **ui**: `"shadcn"` \| `"html"`

Defined in: core/dist/config-types.d.ts:23

***

### validationLevel?

> `optional` **validationLevel?**: `1` \| `2` \| `3`

Defined in: core/dist/config-types.d.ts:29

Validation optimization level. When set, generated code uses per-field validation instead of zodResolver.

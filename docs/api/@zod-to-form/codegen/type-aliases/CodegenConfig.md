[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / CodegenConfig

# Type Alias: CodegenConfig

> **CodegenConfig** = `object`

Defined in: [generate.ts:11](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/codegen/src/generate.ts#L11)

## Properties

### componentConfig?

> `optional` **componentConfig?**: [`ZodFormsConfig`](../../cli/type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: [generate.ts:17](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/codegen/src/generate.ts#L17)

***

### componentName

> **componentName**: `string`

Defined in: [generate.ts:15](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/codegen/src/generate.ts#L15)

***

### exportName

> **exportName**: `string`

Defined in: [generate.ts:14](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/codegen/src/generate.ts#L14)

***

### formProvider?

> `optional` **formProvider?**: `boolean`

Defined in: [generate.ts:22](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/codegen/src/generate.ts#L22)

Force FormProvider wrapper in submit mode. Auto-save mode always uses FormProvider regardless.

***

### mode

> **mode**: `"submit"` \| `"auto-save"`

Defined in: [generate.ts:16](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/codegen/src/generate.ts#L16)

***

### schemaImportPath?

> `optional` **schemaImportPath?**: `string`

Defined in: [generate.ts:13](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/codegen/src/generate.ts#L13)

Optional pre-computed import path for the schema (e.g., './schema.js'). Defaults to './schema'. The CLI typically computes this from file paths; the browser playground can pass it explicitly.

***

### ~~serverAction?~~

> `optional` **serverAction?**: `boolean`

Defined in: [generate.ts:20](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/codegen/src/generate.ts#L20)

#### Deprecated

Currently unused. Reserved for future server action codegen support.

***

### ui

> **ui**: `"shadcn"` \| `"html"`

Defined in: [generate.ts:18](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/codegen/src/generate.ts#L18)

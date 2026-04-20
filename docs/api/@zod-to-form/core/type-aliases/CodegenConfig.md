[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / CodegenConfig

# Type Alias: CodegenConfig

> **CodegenConfig** = `object`

Defined in: [config-types.ts:13](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L13)

## Properties

### componentConfig?

> `optional` **componentConfig?**: [`ZodFormsConfig`](ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: [config-types.ts:23](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L23)

***

### componentName

> **componentName**: `string`

Defined in: [config-types.ts:21](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L21)

***

### exportName

> **exportName**: `string`

Defined in: [config-types.ts:20](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L20)

***

### formProvider?

> `optional` **formProvider?**: `boolean`

Defined in: [config-types.ts:28](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L28)

Force FormProvider wrapper in submit mode. Auto-save mode always uses FormProvider regardless.

***

### mode

> **mode**: `"submit"` \| `"auto-save"`

Defined in: [config-types.ts:22](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L22)

***

### outputPath?

> `optional` **outputPath?**: `string`

Defined in: [config-types.ts:36](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L36)

Output path of the form component — used to compute the .lite.ts import path

***

### schemaImportPath?

> `optional` **schemaImportPath?**: `string`

Defined in: [config-types.ts:19](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L19)

Optional pre-computed import path for the schema (e.g., `./schema.js`).
Defaults to `./schema`. The CLI typically computes this from file paths;
the browser playground and Vite plugin can pass it explicitly.

***

### schemaLite?

> `optional` **schemaLite?**: `$ZodType` \| `null`

Defined in: [config-types.ts:32](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L32)

SchemaLite for submit-time validation of top-level effects (null when no effects exist)

***

### schemaLiteInfo?

> `optional` **schemaLiteInfo?**: [`SchemaLiteInfo`](SchemaLiteInfo.md)

Defined in: [config-types.ts:34](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L34)

Codegen metadata for generating the .lite.ts file

***

### ~~serverAction?~~

> `optional` **serverAction?**: `boolean`

Defined in: [config-types.ts:26](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L26)

#### Deprecated

Currently unused. Reserved for future server action codegen support.

***

### ui

> **ui**: `"shadcn"` \| `"html"`

Defined in: [config-types.ts:24](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L24)

***

### validationLevel?

> `optional` **validationLevel?**: `1` \| `2` \| `3`

Defined in: [config-types.ts:30](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config-types.ts#L30)

Validation optimization level. When set, generated code uses per-field validation instead of zodResolver.

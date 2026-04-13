[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ZodFormsConfig

# Type Alias: ZodFormsConfig\<TComponents, TSchemas\>

> **ZodFormsConfig**\<`TComponents`, `TSchemas`\> = `object`

Defined in: [config.ts:112](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L112)

Root configuration type for `zod-to-form` code generation.

Describes the component library to use, generation defaults, per-schema
overrides, and global field configuration. Pass this to `defineConfig()` in
your `z2f.config.ts` for full type inference, or load and validate it at
runtime with `validateConfig()`.

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

Shape of the component module (used to type `fields.component`).

### TSchemas

`TSchemas` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

Map of schema export names to their Zod schema types (used to type `schemas.[key].fields`).

## Properties

### components

> **components**: [`ComponentsConfig`](ComponentsConfig.md)\<`TComponents`\>

Defined in: [config.ts:116](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L116)

***

### defaults?

> `optional` **defaults?**: [`ConfigDefaults`](ConfigDefaults.md)

Defined in: [config.ts:117](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L117)

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: [config.ts:120](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L120)

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`TypedFieldConfig`](TypedFieldConfig.md)\<`TComponents`\>\>

Defined in: [config.ts:121](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L121)

***

### include?

> `optional` **include?**: `string`[]

Defined in: [config.ts:119](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L119)

***

### schemas?

> `optional` **schemas?**: `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`

Defined in: [config.ts:122](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L122)

***

### types?

> `optional` **types?**: `string`[]

Defined in: [config.ts:118](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L118)

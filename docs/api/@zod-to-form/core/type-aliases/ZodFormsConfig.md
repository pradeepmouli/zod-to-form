[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ZodFormsConfig

# Type Alias: ZodFormsConfig\<TComponents, TSchemas\>

> **ZodFormsConfig**\<`TComponents`, `TSchemas`\> = `object`

Defined in: [config.ts:99](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/config.ts#L99)

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

### TSchemas

`TSchemas` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### components

> **components**: [`ComponentsConfig`](ComponentsConfig.md)\<`TComponents`\>

Defined in: [config.ts:103](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/config.ts#L103)

***

### defaults?

> `optional` **defaults?**: [`ConfigDefaults`](ConfigDefaults.md)

Defined in: [config.ts:104](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/config.ts#L104)

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: [config.ts:107](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/config.ts#L107)

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`TypedFieldConfig`](TypedFieldConfig.md)\<`TComponents`\>\>

Defined in: [config.ts:108](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/config.ts#L108)

***

### include?

> `optional` **include?**: `string`[]

Defined in: [config.ts:106](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/config.ts#L106)

***

### schemas?

> `optional` **schemas?**: `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`

Defined in: [config.ts:109](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/config.ts#L109)

***

### types?

> `optional` **types?**: `string`[]

Defined in: [config.ts:105](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/config.ts#L105)

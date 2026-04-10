[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / ZodFormsConfig

# Type Alias: ZodFormsConfig\<TComponents, TSchemas\>

> **ZodFormsConfig**\<`TComponents`, `TSchemas`\> = `object`

Defined in: core/dist/config.d.ts:71

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

### TSchemas

`TSchemas` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### components

> **components**: [`ComponentsConfig`](../../core/type-aliases/ComponentsConfig.md)\<`TComponents`\>

Defined in: core/dist/config.d.ts:72

***

### defaults?

> `optional` **defaults?**: [`ConfigDefaults`](../../core/type-aliases/ConfigDefaults.md)

Defined in: core/dist/config.d.ts:73

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: core/dist/config.d.ts:76

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`TypedFieldConfig`](../../core/type-aliases/TypedFieldConfig.md)\<`TComponents`\>\>

Defined in: core/dist/config.d.ts:77

***

### include?

> `optional` **include?**: `string`[]

Defined in: core/dist/config.d.ts:75

***

### schemas?

> `optional` **schemas?**: `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`

Defined in: core/dist/config.d.ts:78

***

### types?

> `optional` **types?**: `string`[]

Defined in: core/dist/config.d.ts:74

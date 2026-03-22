[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / ZodFormsConfig

# Type Alias: ZodFormsConfig\<TComponents, TSchemas\>

> **ZodFormsConfig**\<`TComponents`, `TSchemas`\> = `object`

Defined in: core/dist/config.d.ts:76

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

### TSchemas

`TSchemas` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### components

> **components**: [`ComponentsConfig`](../../core/type-aliases/ComponentsConfig.md)\<`TComponents`\>

Defined in: core/dist/config.d.ts:77

***

### defaults?

> `optional` **defaults?**: [`ConfigDefaults`](../../core/type-aliases/ConfigDefaults.md)

Defined in: core/dist/config.d.ts:79

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: core/dist/config.d.ts:82

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`TypedFieldConfig`](../../core/type-aliases/TypedFieldConfig.md)\<`TComponents`\>\>

Defined in: core/dist/config.d.ts:83

***

### formPrimitives?

> `optional` **formPrimitives?**: [`FormPrimitivesConfig`](FormPrimitivesConfig.md)\<`TComponents`\>

Defined in: core/dist/config.d.ts:78

***

### include?

> `optional` **include?**: `string`[]

Defined in: core/dist/config.d.ts:81

***

### schemas?

> `optional` **schemas?**: `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`

Defined in: core/dist/config.d.ts:84

***

### types?

> `optional` **types?**: `string`[]

Defined in: core/dist/config.d.ts:80

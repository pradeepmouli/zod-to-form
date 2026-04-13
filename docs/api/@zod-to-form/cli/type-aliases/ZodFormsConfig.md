[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / ZodFormsConfig

# Type Alias: ZodFormsConfig\<TComponents, TSchemas\>

> **ZodFormsConfig**\<`TComponents`, `TSchemas`\> = `object`

Defined in: core/dist/config.d.ts:84

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

> **components**: [`ComponentsConfig`](../../core/type-aliases/ComponentsConfig.md)\<`TComponents`\>

Defined in: core/dist/config.d.ts:85

***

### defaults?

> `optional` **defaults?**: [`ConfigDefaults`](../../core/type-aliases/ConfigDefaults.md)

Defined in: core/dist/config.d.ts:86

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: core/dist/config.d.ts:89

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`TypedFieldConfig`](../../core/type-aliases/TypedFieldConfig.md)\<`TComponents`\>\>

Defined in: core/dist/config.d.ts:90

***

### include?

> `optional` **include?**: `string`[]

Defined in: core/dist/config.d.ts:88

***

### schemas?

> `optional` **schemas?**: `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`

Defined in: core/dist/config.d.ts:91

***

### types?

> `optional` **types?**: `string`[]

Defined in: core/dist/config.d.ts:87

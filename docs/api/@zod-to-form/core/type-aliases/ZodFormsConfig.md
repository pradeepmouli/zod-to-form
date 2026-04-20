[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ZodFormsConfig

# Type Alias: ZodFormsConfig\<TComponents, TSchemas\>

> **ZodFormsConfig**\<`TComponents`, `TSchemas`\> = `object`

Defined in: [config.ts:125](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/config.ts#L125)

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

Defined in: [config.ts:129](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/config.ts#L129)

***

### defaults?

> `optional` **defaults?**: [`ConfigDefaults`](ConfigDefaults.md)

Defined in: [config.ts:130](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/config.ts#L130)

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: [config.ts:133](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/config.ts#L133)

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`TypedFieldConfig`](TypedFieldConfig.md)\<`TComponents`\>\>

Defined in: [config.ts:134](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/config.ts#L134)

***

### include?

> `optional` **include?**: `string`[]

Defined in: [config.ts:132](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/config.ts#L132)

***

### schemas?

> `optional` **schemas?**: `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`

Defined in: [config.ts:135](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/config.ts#L135)

***

### types?

> `optional` **types?**: `string`[]

Defined in: [config.ts:131](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/config.ts#L131)

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ZodFormsConfig

# Type Alias: ZodFormsConfig\<TComponents, TSchemas\>

> **ZodFormsConfig**\<`TComponents`, `TSchemas`\> = `object`

Defined in: config.ts:168

Canonical authored configuration shared by CLI, Vite, and configuration editors.
Required components.source names the import module. Generation defaults and
independent compilation live in defaults.optimization. Schemas are keyed by
exported identifier: name/mode/out/serverAction apply only to the root, while
component/fields follow schema identity when registered by the loader.

Variants are ConfigPatch layers and cannot contain nested variants.
defineConfig preserves authored values; resolveFormConfig expands the final
preset after layer merging. Component override entries and field props replace
whole entries; fields otherwise merge per property. Unknown root keys fail
validation, while field metadata supports application-specific extensions.

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

### TSchemas

`TSchemas` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### components

> **components**: [`ComponentsConfig`](ComponentsConfig.md)\<`TComponents`\>

Defined in: config.ts:172

***

### defaults?

> `optional` **defaults?**: [`ConfigDefaults`](ConfigDefaults.md)

Defined in: config.ts:174

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: config.ts:177

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`TypedFieldConfig`](TypedFieldConfig.md)\<`TComponents`\>\>

Defined in: config.ts:178

***

### include?

> `optional` **include?**: `string`[]

Defined in: config.ts:176

***

### schemas?

> `optional` **schemas?**: `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`

Defined in: config.ts:179

***

### types?

> `optional` **types?**: `string`[]

Defined in: config.ts:175

***

### variants?

> `optional` **variants?**: `Record`\<`string`, [`ConfigPatch`](ConfigPatch.md)\<`TComponents`, `TSchemas`\>\>

Defined in: config.ts:173

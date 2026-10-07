[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / ZodFormsConfig

# Type Alias: ZodFormsConfig\<TComponents, TSchemas\>

> **ZodFormsConfig**\<`TComponents`, `TSchemas`\> = `object`

Defined in: core/dist/config.d.ts:140

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

> **components**: [`ComponentsConfig`](../../core/type-aliases/ComponentsConfig.md)\<`TComponents`\>

Defined in: core/dist/config.d.ts:141

***

### defaults?

> `optional` **defaults?**: [`ConfigDefaults`](../../core/type-aliases/ConfigDefaults.md)

Defined in: core/dist/config.d.ts:143

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: core/dist/config.d.ts:146

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`TypedFieldConfig`](../../core/type-aliases/TypedFieldConfig.md)\<`TComponents`\>\>

Defined in: core/dist/config.d.ts:147

***

### include?

> `optional` **include?**: `string`[]

Defined in: core/dist/config.d.ts:145

***

### schemas?

> `optional` **schemas?**: `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`

Defined in: core/dist/config.d.ts:148

***

### types?

> `optional` **types?**: `string`[]

Defined in: core/dist/config.d.ts:144

***

### variants?

> `optional` **variants?**: `Record`\<`string`, [`ConfigPatch`](../../core/type-aliases/ConfigPatch.md)\<`TComponents`, `TSchemas`\>\>

Defined in: core/dist/config.d.ts:142

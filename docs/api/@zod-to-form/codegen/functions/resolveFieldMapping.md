[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / resolveFieldMapping

# Function: resolveFieldMapping()

> **resolveFieldMapping**\<`TComponents`\>(`fieldKey`, `componentName`, `componentConfig`): `object`

Defined in: [generate.ts:173](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/codegen/src/generate.ts#L173)

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### fieldKey

`string`

### componentName

`string` \| `undefined`

### componentConfig

[`ZodFormsConfig`](../../cli/type-aliases/ZodFormsConfig.md)\<`TComponents`\> \| `undefined`

## Returns

`object`

### componentName?

> `optional` **componentName?**: `string`

### componentOverride?

> `optional` **componentOverride?**: [`ComponentOverride`](../../cli/type-aliases/ComponentOverride.md)

### override?

> `optional` **override?**: [`FieldConfig`](../../cli/type-aliases/FieldConfig.md)

### source

> **source**: `"fields"` \| `"components"` \| `"none"`

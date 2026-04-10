[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / resolveFieldMapping

# Function: resolveFieldMapping()

> **resolveFieldMapping**\<`TComponents`\>(`fieldKey`, `componentName`, `componentConfig`): `object`

Defined in: [generate.ts:172](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/codegen/src/generate.ts#L172)

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

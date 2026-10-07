[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ProcessParams

# Interface: ProcessParams

Defined in: types.ts:319

Optional parameters passed to each processor alongside the schema, context, and field.
Provides parent key and array-item metadata needed for path construction.

## Properties

### index?

> `optional` **index?**: `number`

Defined in: types.ts:325

Array item index for rendering

***

### isArrayItem?

> `optional` **isArrayItem?**: `boolean`

Defined in: types.ts:323

Whether this field is an array item template

***

### parentKey?

> `optional` **parentKey?**: `string`

Defined in: types.ts:321

Parent field path for nested fields

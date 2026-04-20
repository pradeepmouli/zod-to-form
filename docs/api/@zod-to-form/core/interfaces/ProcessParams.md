[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ProcessParams

# Interface: ProcessParams

Defined in: [types.ts:240](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L240)

Optional parameters passed to each processor alongside the schema, context, and field.
Provides parent key and array-item metadata needed for path construction.

## Properties

### index?

> `optional` **index?**: `number`

Defined in: [types.ts:246](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L246)

Array item index for rendering

***

### isArrayItem?

> `optional` **isArrayItem?**: `boolean`

Defined in: [types.ts:244](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L244)

Whether this field is an array item template

***

### parentKey?

> `optional` **parentKey?**: `string`

Defined in: [types.ts:242](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L242)

Parent field path for nested fields

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ProcessParams

# Interface: ProcessParams

Defined in: [types.ts:260](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L260)

Optional parameters passed to each processor alongside the schema, context, and field.
Provides parent key and array-item metadata needed for path construction.

## Properties

### index?

> `optional` **index?**: `number`

Defined in: [types.ts:266](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L266)

Array item index for rendering

***

### isArrayItem?

> `optional` **isArrayItem?**: `boolean`

Defined in: [types.ts:264](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L264)

Whether this field is an array item template

***

### parentKey?

> `optional` **parentKey?**: `string`

Defined in: [types.ts:262](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L262)

Parent field path for nested fields

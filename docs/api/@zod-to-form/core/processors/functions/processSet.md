[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processSet

# Function: processSet()

> **processSet**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/collections.ts:16](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/core/src/processors/collections.ts#L16)

Process `z.set()` — renders as an array-like repeater of unique items.
The value type determines the item template stored in `field.arrayItem`.

## Parameters

### schema

`$ZodSet`

The `$ZodSet` schema whose `valueType` drives the item template.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing child processing.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Parent path metadata for constructing the item template key.

## Returns

`void`

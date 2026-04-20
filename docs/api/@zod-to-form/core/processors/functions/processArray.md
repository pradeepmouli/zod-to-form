[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processArray

# Function: processArray()

> **processArray**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/array.ts:19](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/processors/array.ts#L19)

Process `z.array()` — renders as an `ArrayField` component with an item template.
Extracts `minLength`/`maxLength` from the constraint bag and recurses on the element type.

## Parameters

### schema

`$ZodArray`

The `$ZodArray` schema to process.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing processor registry and child processing.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Parent path metadata for constructing the item template key.

## Returns

`void`

## Remarks

The item template is constructed at key `parentKey.0` (first index).
The runtime ArrayBlock and codegen both use `field.arrayItem` to build the repeater.

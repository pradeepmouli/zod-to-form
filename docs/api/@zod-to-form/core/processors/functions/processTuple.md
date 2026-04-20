[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processTuple

# Function: processTuple()

> **processTuple**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/array.ts:62](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/processors/array.ts#L62)

Process `z.tuple()` — renders as a `Fieldset` where each tuple item becomes a child field.
Tuple items are keyed by their index (e.g. `"tupleField.0"`, `"tupleField.1"`).

## Parameters

### schema

`$ZodTuple`

The `$ZodTuple` schema to process.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing child processing.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Parent path metadata for constructing item keys.

## Returns

`void`

## Remarks

Fixed-length tuples render all items eagerly. Rest elements are not currently supported
and will produce an empty children array if present.

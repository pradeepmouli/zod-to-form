[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processIntersection

# Function: processIntersection()

> **processIntersection**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/object.ts:60](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/processors/object.ts#L60)

Process `z.intersection()` — renders as a `Fieldset` that merges the left and right shape entries.
Both the left and right schemas must be `z.object()` types for their shapes to be merged.
Non-object intersection members are silently skipped.

## Parameters

### schema

`$ZodIntersection`

The `$ZodIntersection` schema whose left/right shapes are merged.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing child processing.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Parent path metadata for constructing nested field keys.

## Returns

`void`

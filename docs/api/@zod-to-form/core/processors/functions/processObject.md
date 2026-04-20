[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processObject

# Function: processObject()

> **processObject**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/object.ts:35](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/processors/object.ts#L35)

Process `z.object()` — renders as a `Fieldset` with each shape key as a child field.
Recursively processes all shape entries via `ctx.processChild`.

## Parameters

### schema

`$ZodObject`

The `$ZodObject` schema whose shape defines the child fields.

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

## Remarks

The fieldset label is inferred from `params.parentKey` or `field.key` via `inferLabel`.
Schema-level metadata (title, description) can override the inferred label via `resolveMetadata`.

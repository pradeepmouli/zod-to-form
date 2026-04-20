[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processReadonly

# Function: processReadonly()

> **processReadonly**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/wrappers.ts:126](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/processors/wrappers.ts#L126)

Process `z.readonly()` — marks the field as read-only and delegates to the inner type.
The rendered component receives `readOnly: true` via the base field props.

## Parameters

### schema

`$ZodReadonly`

The `$ZodReadonly` schema to unwrap.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing the processor registry for inner type dispatch.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Parent path metadata passed through to the inner processor.

## Returns

`void`

[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processPipe

# Function: processPipe()

> **processPipe**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/wrappers.ts:151](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/processors/wrappers.ts#L151)

Process `z.pipe()` — unwraps to the input type and delegates to its processor.
The output/transform side is handled by the L1 optimizer for submit-time validation.

## Parameters

### schema

`$ZodPipe`

The `$ZodPipe` schema whose `in` type drives the rendered field.

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

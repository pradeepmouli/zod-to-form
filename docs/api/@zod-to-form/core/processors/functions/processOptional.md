[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processOptional

# Function: processOptional()

> **processOptional**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/wrappers.ts:44](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/processors/wrappers.ts#L44)

Process `z.optional()` — unwraps to the inner type and marks the field as not required.
Delegates to the inner type's processor for all component and constraint extraction.

## Parameters

### schema

`$ZodOptional`

The `$ZodOptional` schema to unwrap.

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

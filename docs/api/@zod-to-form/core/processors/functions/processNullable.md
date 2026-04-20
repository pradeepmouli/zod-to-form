[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processNullable

# Function: processNullable()

> **processNullable**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/wrappers.ts:69](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/processors/wrappers.ts#L69)

Process `z.nullable()` — unwraps to the inner type and marks the field as not required.
Nullable fields accept null in addition to the inner type; the field renders normally.

## Parameters

### schema

`$ZodNullable`

The `$ZodNullable` schema to unwrap.

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

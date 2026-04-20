[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processNullable

# Function: processNullable()

> **processNullable**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/wrappers.ts:69](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/processors/wrappers.ts#L69)

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

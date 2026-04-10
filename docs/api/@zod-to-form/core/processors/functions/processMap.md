[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processMap

# Function: processMap()

> **processMap**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/collections.ts:29](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/processors/collections.ts#L29)

Process z.map() — renders as an array-like repeater of key-value pair fieldsets.
Each entry has a `key` field and a `value` field derived from the Map's type params.

## Parameters

### schema

`$ZodMap`

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

### field

[`FormField`](../../interfaces/FormField.md)

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

## Returns

`void`

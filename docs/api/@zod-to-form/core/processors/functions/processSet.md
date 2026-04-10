[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processSet

# Function: processSet()

> **processSet**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/collections.ts:9](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/processors/collections.ts#L9)

Process z.set() — renders as an array-like repeater of unique items.
The value type determines the item template.

## Parameters

### schema

`$ZodSet`

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

### field

[`FormField`](../../interfaces/FormField.md)

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

## Returns

`void`

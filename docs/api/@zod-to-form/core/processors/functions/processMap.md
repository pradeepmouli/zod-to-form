[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processMap

# Function: processMap()

> **processMap**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/collections.ts:43](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/processors/collections.ts#L43)

Process `z.map()` — renders as an array-like repeater of key-value pair fieldsets.
Each entry has a `key` field and a `value` field derived from the Map's type params.

## Parameters

### schema

`$ZodMap`

The `$ZodMap` schema whose `keyType` and `valueType` drive the entry fieldset.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing child processing for key and value fields.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Parent path metadata for constructing the entry fieldset key.

## Returns

`void`

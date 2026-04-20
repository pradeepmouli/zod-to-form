[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processRecord

# Function: processRecord()

> **processRecord**(`schema`, `_ctx`, `field`, `_params`): `void`

Defined in: [processors/record.ts:16](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/processors/record.ts#L16)

Process `z.record()` — renders as a plain `Input` with an item template derived from the value type.
The item template is stored in `field.arrayItem` for codegen to use in dynamic key-value entry forms.

## Parameters

### schema

`$ZodRecord`

The `$ZodRecord` schema whose `valueType` drives the item template.

### \_ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context (unused for record processing).

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

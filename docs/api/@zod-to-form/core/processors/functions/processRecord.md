[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processRecord

# Function: processRecord()

> **processRecord**(`schema`, `_ctx`, `field`, `_params`): `void`

Defined in: [processors/record.ts:16](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/processors/record.ts#L16)

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

[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processLiteral

# Function: processLiteral()

> **processLiteral**(`schema`, `_ctx`, `field`, `_params`): `void`

Defined in: [processors/enum.ts:61](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/processors/enum.ts#L61)

Process `z.literal()` — renders as a read-only `Select` with a single fixed option.
The field is marked `readOnly` because literal fields have exactly one valid value.

## Parameters

### schema

`$ZodLiteral`

The `$ZodLiteral` schema whose values define the select options.

### \_ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context (unused for literal processing).

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

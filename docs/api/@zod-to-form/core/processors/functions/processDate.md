[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processDate

# Function: processDate()

> **processDate**(`_schema`, `_ctx`, `field`, `_params`): `void`

Defined in: [processors/date.ts:15](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/processors/date.ts#L15)

Process `z.date()` / `z.iso.date()` — renders as a `DatePicker` component.
No constraints are extracted from the date schema — date validation is handled by the resolver.

## Parameters

### \_schema

`$ZodDate`\<`unknown`\> \| `$ZodISODate`

The date schema (unused; date type has no constraint bag entries).

### \_ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context (unused for date processing).

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

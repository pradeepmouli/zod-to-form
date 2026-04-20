[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processEnum

# Function: processEnum()

> **processEnum**(`schema`, `_ctx`, `field`, `_params`): `void`

Defined in: [processors/enum.ts:35](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/processors/enum.ts#L35)

Process `z.enum()` — renders as a `Select` component with options derived from enum entries.
Duplicate values are deduplicated, and labels are generated via `inferLabel`.

## Parameters

### schema

`$ZodEnum`

The `$ZodEnum` schema whose entries define the select options.

### \_ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context (unused for enum processing).

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

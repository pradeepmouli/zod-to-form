[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processFallback

# Function: processFallback()

> **processFallback**(`schema`, `_ctx`, `field`, `_params`): `void`

Defined in: [processors/fallback.ts:17](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/processors/fallback.ts#L17)

Fallback processor for Zod types without a dedicated handler.
Renders as a plain text `Input`, preserving the schema's `def.type` on the field.
Used for `custom`, `any`, `unknown`, `nan`, `void`, `null`, `undefined`, `symbol`,
`transform`, `promise`, `function`, and other exotic types.

## Parameters

### schema

`$ZodType`

The unhandled Zod schema.

### \_ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context (unused by the fallback).

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

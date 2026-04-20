[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processTemplateLiteral

# Function: processTemplateLiteral()

> **processTemplateLiteral**(`schema`, `_ctx`, `field`, `_params`): `void`

Defined in: [processors/string.ts:102](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/processors/string.ts#L102)

Process `z.templateLiteral()` — renders as a plain text `Input`.
Template literals have a fixed structure; no constraints are extracted.

## Parameters

### schema

`$ZodTemplateLiteral`

The `$ZodTemplateLiteral` schema to process.

### \_ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context (unused for template literal processing).

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

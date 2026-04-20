[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processTemplateLiteral

# Function: processTemplateLiteral()

> **processTemplateLiteral**(`schema`, `_ctx`, `field`, `_params`): `void`

Defined in: [processors/string.ts:102](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/processors/string.ts#L102)

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

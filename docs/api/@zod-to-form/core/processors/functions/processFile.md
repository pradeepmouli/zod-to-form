[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processFile

# Function: processFile()

> **processFile**(`_schema`, `_ctx`, `field`, `_params`): `void`

Defined in: [processors/file.ts:16](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/processors/file.ts#L16)

Process `z.file()` — renders as a `FileInput` component.
No constraints are extracted. The field renderer sets `valueAsFile: true` on registration
so RHF stores a `File` object rather than the raw input value.

## Parameters

### \_schema

`$ZodType`

The file schema (unused; no bag constraints for files).

### \_ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context (unused for file processing).

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

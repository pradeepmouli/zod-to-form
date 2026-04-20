[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processCrossRef

# Function: processCrossRef()

> **processCrossRef**(`schema`, `ctx`, `field`, `_params`): `void`

Defined in: [processors/cross-ref.ts:21](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/processors/cross-ref.ts#L21)

Process a cross-reference field — a schema annotated in the form registry with `refType`.
Renders as a `cross-ref` component placeholder that the consuming application resolves
to a form-linked picker or relationship field at runtime.

## Parameters

### schema

`$ZodType`

The Zod schema annotated with `{ props: { refType: 'EntityName' } }` in the registry.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing the form registry for metadata lookup.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

## Remarks

Cross-ref is not a built-in Zod type — it is activated by registering a schema in the form
registry with `{ props: { refType: 'EntityName' } }` and manually mapping it in the processor
registry to `processCrossRef`. The component name `"cross-ref"` must be mapped in the component module.

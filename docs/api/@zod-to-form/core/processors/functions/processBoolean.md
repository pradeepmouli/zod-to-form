[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processBoolean

# Function: processBoolean()

> **processBoolean**(`schema`, `ctx`, `field`, `_params`): `void`

Defined in: [processors/boolean.ts:19](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/processors/boolean.ts#L19)

Process `z.boolean()` — renders as a `Checkbox` component (or a component override from the registry).
Marks the field as required since boolean fields always have a value (true/false).

## Parameters

### schema

`$ZodBoolean`

The `$ZodBoolean` schema to process.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing the form registry for component overrides.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

## Remarks

Component can be overridden via `z.registry<FormMeta>()` with `{ component: 'Switch' }`.
The `required: true` default reflects that a boolean always resolves to true or false — never undefined.

[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processDefault

# Function: processDefault()

> **processDefault**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/wrappers.ts:94](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/processors/wrappers.ts#L94)

Process `z.default()` / `z.prefault()` — extracts the default value and delegates to the inner type.
Sets `field.defaultValue` from the schema's default (evaluating functions eagerly).

## Parameters

### schema

`$ZodDefault`\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\> \| `$ZodPrefault`\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>

The `$ZodDefault` or `$ZodPrefault` schema to unwrap.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing the processor registry for inner type dispatch.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Parent path metadata passed through to the inner processor.

## Returns

`void`

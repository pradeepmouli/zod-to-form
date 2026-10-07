[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / resolveBaseProps

# Function: resolveBaseProps()

> **resolveBaseProps**(`field`): `Record`\<`string`, `unknown`\>

Defined in: resolve-base-props.ts:10

Static, schema-derived base props every field's component receives, identical
across all zodTypes. `aria-invalid` is intentionally excluded — it derives from
runtime error state, so each renderer materializes it.

## Parameters

### field

[`FormField`](../interfaces/FormField.md)

## Returns

`Record`\<`string`, `unknown`\>

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / walkSchema

# Function: walkSchema()

> **walkSchema**(`schema`, `options?`): [`FormField`](../interfaces/FormField.md)[]

Defined in: [walker.ts:94](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/walker.ts#L94)

Walk a Zod schema and produce a FormField[] tree.

## Parameters

### schema

`$ZodType`

A Zod object schema (top-level must be z.object())

### options?

[`WalkOptions`](../interfaces/WalkOptions.md)

Optional configuration for the walk

## Returns

[`FormField`](../interfaces/FormField.md)[]

FormField[] - Ordered array of field descriptors

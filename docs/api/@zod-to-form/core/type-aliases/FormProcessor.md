[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormProcessor

# Type Alias: FormProcessor\<T\>

> **FormProcessor**\<`T`\> = (`schema`, `ctx`, `field`, `params`) => `void`

Defined in: [types.ts:304](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L304)

A processor function that mutates a `FormField` in-place based on the Zod schema it handles.
Dispatched by the walker based on `schema._zod.def.type`. Register custom processors
via `walkSchema(schema, { processors: { myType: myProcessor } })`.

## Type Parameters

### T

`T` *extends* `$ZodType` = `$ZodType`

## Parameters

### schema

`T`

### ctx

[`FormProcessorContext`](../interfaces/FormProcessorContext.md)

### field

[`FormField`](../interfaces/FormField.md)

### params

[`ProcessParams`](../interfaces/ProcessParams.md)

## Returns

`void`

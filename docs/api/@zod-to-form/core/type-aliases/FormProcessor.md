[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormProcessor

# Type Alias: FormProcessor\<T\>

> **FormProcessor**\<`T`\> = (`schema`, `ctx`, `field`, `params`) => `void`

Defined in: [types.ts:284](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/types.ts#L284)

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

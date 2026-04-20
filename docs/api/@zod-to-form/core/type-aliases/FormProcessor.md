[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormProcessor

# Type Alias: FormProcessor\<T\>

> **FormProcessor**\<`T`\> = (`schema`, `ctx`, `field`, `params`) => `void`

Defined in: [types.ts:284](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/types.ts#L284)

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

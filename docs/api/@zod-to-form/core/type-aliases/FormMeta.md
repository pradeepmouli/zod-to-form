[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormMeta

# Type Alias: FormMeta\<T\>

> **FormMeta**\<`T`\> = [`FieldConfig`](FieldConfig.md)\<`T`\> & `object`

Defined in: [types.ts:164](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L164)

## Type Declaration

### render?

> `optional` **render?**: (`field`, `props`) => `unknown`

Custom render function (runtime only, ignored in codegen)

#### Parameters

##### field

[`FormField`](../interfaces/FormField.md)

##### props

`unknown`

#### Returns

`unknown`

## Type Parameters

### T

`T` *extends* `$ZodType` = `$ZodType`

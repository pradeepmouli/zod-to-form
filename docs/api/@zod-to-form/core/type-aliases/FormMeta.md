[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormMeta

# Type Alias: FormMeta\<T\>

> **FormMeta**\<`T`\> = [`FieldConfig`](FieldConfig.md)\<`T`\> & `object`

Defined in: [types.ts:247](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L247)

Per-schema annotation stored in a `z.registry<FormMeta>()`.
Extends `FieldConfig` with a runtime-only `render` function for custom field rendering.
Used with `registerDeep()` / `registerFlat()` to attach form metadata to Zod schemas.

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

The Zod schema type this meta is attached to.

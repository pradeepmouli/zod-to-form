[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / FormMeta

# Type Alias: FormMeta\<T\>

> **FormMeta**\<`T`\> = [`FieldConfig`](FieldConfig.md)\<`T`\> & `object`

Defined in: packages/core/dist/types.d.ts:235

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

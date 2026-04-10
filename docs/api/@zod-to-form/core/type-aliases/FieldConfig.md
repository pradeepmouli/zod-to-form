[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FieldConfig

# Type Alias: FieldConfig\<T\>

> **FieldConfig**\<`T`\> = `FieldConfigBase` & `FieldConfigExtras`\<`T`\>

Defined in: [types.ts:157](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/types.ts#L157)

Per-field configuration that customises how a Zod schema field is rendered.

Merges base options (component override, visibility, order, props) with type-aware
extras: nested `fields` for object schemas, and `arrayItems` for array schemas.
Use this type when annotating a `ZodFormsConfig.fields` record or a per-schema
`schemas.[key].fields` map.

## Type Parameters

### T

`T` *extends* `$ZodType` = `$ZodType`

The Zod schema type of the field, used to constrain nested `fields` and `arrayItems`.

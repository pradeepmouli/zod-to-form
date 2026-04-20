[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / getEmptyDefault

# Function: getEmptyDefault()

> **getEmptyDefault**(`field`): `unknown`

Defined in: [utils.ts:174](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/utils.ts#L174)

Returns a type-safe empty default value for a FormField based on its zodType
and structure. Used by codegen for useFieldArray append() defaults and
by runtime for initial values.

- string → ''
- number/bigint → 0
- boolean → false
- date → undefined
- object (Fieldset) → recursively builds from children
- array (ArrayField) → []
- enum → first option value or ''
- union/discriminatedUnion → first variant's empty default

## Parameters

### field

[`FormField`](../interfaces/FormField.md)

The FormField to generate an empty default for.

## Returns

`unknown`

An empty default value matching the field's type structure.

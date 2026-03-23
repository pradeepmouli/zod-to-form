[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / getEmptyDefault

# Function: getEmptyDefault()

> **getEmptyDefault**(`field`): `unknown`

Defined in: [utils.ts:158](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/utils.ts#L158)

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

## Returns

`unknown`

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / getEmptyDefault

# Function: getEmptyDefault()

> **getEmptyDefault**(`field`): `unknown`

Defined in: [utils.ts:152](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/utils.ts#L152)

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

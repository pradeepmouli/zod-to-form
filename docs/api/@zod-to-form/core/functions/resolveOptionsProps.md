[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / resolveOptionsProps

# Function: resolveOptionsProps()

> **resolveOptionsProps**(`field`): `Record`\<`string`, `unknown`\>

Defined in: resolve-options-props.ts:12

Extract options props from a field for enum/union select-style components.

Returns `{ options: field.options }` when the field carries options, or `{}`
for fields without options (e.g. plain string/number inputs). This is the
single source so runtime and codegen agree on how options flow to a component.

## Parameters

### field

[`FormField`](../interfaces/FormField.md)

## Returns

`Record`\<`string`, `unknown`\>

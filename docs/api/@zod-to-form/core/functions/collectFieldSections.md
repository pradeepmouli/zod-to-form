[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / collectFieldSections

# Function: collectFieldSections()

> **collectFieldSections**(`fields`, `getOverride`): `Map`\<`string`, `string`[]\>

Defined in: [utils.ts:242](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/utils.ts#L242)

Collect section groupings from fields and a config override lookup.
Returns a Map of section name → array of field keys that belong to it.

## Parameters

### fields

[`FormField`](../interfaces/FormField.md)[]

### getOverride

(`key`) => \{ `section?`: `string`; \} \| `undefined`

## Returns

`Map`\<`string`, `string`[]\>

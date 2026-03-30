[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / collectFieldSections

# Function: collectFieldSections()

> **collectFieldSections**(`fields`, `getOverride`): `Map`\<`string`, `string`[]\>

Defined in: [utils.ts:248](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/utils.ts#L248)

Collect section groupings from fields and a config override lookup.
Returns a Map of section name → array of field keys that belong to it.

## Parameters

### fields

[`FormField`](../interfaces/FormField.md)[]

### getOverride

(`key`) => \{ `section?`: `string`; \} \| `undefined`

## Returns

`Map`\<`string`, `string`[]\>

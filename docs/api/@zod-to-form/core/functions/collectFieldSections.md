[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / collectFieldSections

# Function: collectFieldSections()

> **collectFieldSections**(`fields`, `getOverride`): `Map`\<`string`, `string`[]\>

Defined in: [utils.ts:276](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/utils.ts#L276)

Collect section groupings from fields and a config override lookup.
Returns a Map of section name → array of field keys that belong to it.
Recursively visits nested children and array item templates.

## Parameters

### fields

[`FormField`](../interfaces/FormField.md)[]

The flat or nested FormField array to scan for section assignments.

### getOverride

(`key`) => \{ `section?`: `string`; \} \| `undefined`

A function that returns the config override (if any) for a given field key.

## Returns

`Map`\<`string`, `string`[]\>

A Map from section name to the ordered list of field keys assigned to that section.

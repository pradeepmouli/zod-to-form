[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / resolveNativeAttrs

# Function: resolveNativeAttrs()

> **resolveNativeAttrs**(`field`): `Record`\<`string`, `unknown`\>

Defined in: resolve-native-attrs.ts:29

Extract DOM-valid native attributes from a field's props.

Only keys listed in `NATIVE_INPUT_ATTRS` are included; internal props (e.g.
`_isSet`) and component-specific props are silently ignored. Null and
undefined values are skipped so the result only contains meaningful attrs.

## Parameters

### field

[`FormField`](../interfaces/FormField.md)

## Returns

`Record`\<`string`, `unknown`\>

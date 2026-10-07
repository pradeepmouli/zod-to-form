[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / NATIVE\_INPUT\_ATTRS

# Variable: NATIVE\_INPUT\_ATTRS

> `const` **NATIVE\_INPUT\_ATTRS**: readonly \[`"type"`, `"minLength"`, `"maxLength"`, `"pattern"`, `"min"`, `"max"`, `"step"`\]

Defined in: resolve-native-attrs.ts:10

The set of DOM-valid native input attributes extracted from `field.props`.
This is the single source of truth so runtime and codegen agree on which props
flow through to the native element. Extend deliberately, not blindly.

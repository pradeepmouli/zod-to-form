[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FieldExpression

# Type Alias: FieldExpression

> **FieldExpression** = `"field.value"` \| `"field.onChange"` \| `"field.onBlur"` \| `"field.ref"` \| `"field.name"`

Defined in: [types.ts:98](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L98)

Known RHF field expression strings that can be used as values in `props`.
When a prop value matches one of these strings, it is resolved from the
RHF controller field at render time instead of being passed as a literal.

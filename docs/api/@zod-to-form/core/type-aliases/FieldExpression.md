[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FieldExpression

# Type Alias: FieldExpression

> **FieldExpression** = `"field.value"` \| `"field.onChange"` \| `"field.onBlur"` \| `"field.ref"` \| `"field.name"`

Defined in: [types.ts:155](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/types.ts#L155)

Known RHF field expression strings that can be used as values in `props`.
When a prop value matches one of these strings, it is resolved from the
RHF controller field at render time instead of being passed as a literal.

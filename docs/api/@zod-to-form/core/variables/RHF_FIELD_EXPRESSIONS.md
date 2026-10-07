[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / RHF\_FIELD\_EXPRESSIONS

# Variable: RHF\_FIELD\_EXPRESSIONS

> `const` **RHF\_FIELD\_EXPRESSIONS**: `ReadonlySet`\<`string`\>

Defined in: config.ts:449

Known RHF field expression strings recognized in component props config.
When a prop value matches one of these strings, codegen emits it as a JSX
expression (`{field.value}`) rather than a literal string.

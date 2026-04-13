[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / ComponentOverride

# Type Alias: ComponentOverride

> **ComponentOverride** = `object`

Defined in: core/dist/config.d.ts:5

Per-component metadata override. Only components that differ from defaults need an entry.

## Properties

### controlled?

> `optional` **controlled?**: `boolean`

Defined in: core/dist/config.d.ts:7

When true, use Controller/useController instead of register() spread

***

### props?

> `optional` **props?**: `Record`\<`string`, `unknown`\>

Defined in: core/dist/config.d.ts:13

Default props for this component type.
Values matching a known field expression string are resolved from the RHF controller.
Per-field props override these via shallow merge (field config wins).

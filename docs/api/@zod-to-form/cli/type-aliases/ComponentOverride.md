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

### propMap?

> `optional` **propMap?**: `Record`\<`string`, `string`\>

Defined in: core/dist/config.d.ts:9

Map RHF field props to component-specific prop names (e.g. { onSelect: 'field.onChange' })

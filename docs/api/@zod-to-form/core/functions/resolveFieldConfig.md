[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / resolveFieldConfig

# Function: resolveFieldConfig()

> **resolveFieldConfig**(`globalFields`, `schemaFields`): `Record`\<`string`, [`FieldConfig`](../type-aliases/FieldConfig.md)\>

Defined in: [config.ts:509](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config.ts#L509)

Merge global field config with per-schema field config overrides.
Per-schema entries shallow-merge on top of global entries for the same key.
Returns an empty record when both inputs are undefined.

## Parameters

### globalFields

`Record`\<`string`, [`FieldConfig`](../type-aliases/FieldConfig.md)\> \| `undefined`

Global field overrides from `ZodFormsConfig.fields`.

### schemaFields

`Partial`\<`Record`\<`string`, [`FieldConfig`](../type-aliases/FieldConfig.md)\>\> \| `undefined`

Per-schema field overrides from `ZodFormsConfig.schemas[key].fields`.

## Returns

`Record`\<`string`, [`FieldConfig`](../type-aliases/FieldConfig.md)\>

Merged field config map where schema-level overrides win on conflict.

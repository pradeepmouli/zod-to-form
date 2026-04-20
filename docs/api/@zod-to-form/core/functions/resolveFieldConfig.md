[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / resolveFieldConfig

# Function: resolveFieldConfig()

> **resolveFieldConfig**(`globalFields`, `schemaFields`): `Record`\<`string`, [`FieldConfig`](../type-aliases/FieldConfig.md)\>

Defined in: [config.ts:511](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L511)

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

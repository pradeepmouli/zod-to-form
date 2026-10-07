[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ConfigPatch

# Type Alias: ConfigPatch\<TComponents, TSchemas\>

> **ConfigPatch**\<`TComponents`, `TSchemas`\> = `Omit`\<`Partial`\<[`ZodFormsConfig`](ZodFormsConfig.md)\<`TComponents`, `TSchemas`\>\>, `"components"` \| `"variants"`\> & `object`

Defined in: config.ts:240

Partial canonical configuration used by variants and adapter overrides.

## Type Declaration

### components?

> `optional` **components?**: `Partial`\<[`ComponentsConfig`](ComponentsConfig.md)\<`TComponents`\>\>

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

### TSchemas

`TSchemas` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

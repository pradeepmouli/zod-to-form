[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / validateConfig

# Function: validateConfig()

> **validateConfig**(`value`, `source?`): [`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: core/dist/config.d.ts:399

Validate canonical authored configuration without expanding presets.
Unknown root keys are rejected; known nested properties retain validation,
and field metadata supports application extensions.

## Parameters

### value

`unknown`

### source?

`string`

## Returns

[`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

## Throws

Descriptive configuration error for invalid input.

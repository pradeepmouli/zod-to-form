[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / validateConfig

# Function: validateConfig()

> **validateConfig**(`value`, `source?`): [`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: config.ts:509

Validate canonical authored configuration without expanding presets.
Unknown root keys are rejected; known nested properties retain validation,
and field metadata supports application extensions.

## Parameters

### value

`unknown`

### source?

`string` = `'config'`

## Returns

[`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

## Throws

Descriptive configuration error for invalid input.

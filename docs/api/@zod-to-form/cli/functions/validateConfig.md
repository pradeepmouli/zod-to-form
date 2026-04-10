[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / validateConfig

# Function: validateConfig()

> **validateConfig**(`value`, `source?`): [`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: core/dist/config.d.ts:142

Validates an unknown value as a `ZodFormsConfig` at runtime.

Parses `value` using the internal Zod config schema and throws a descriptive
error if validation fails. Use this when loading config from untrusted sources
such as JSON files or dynamic `import()` calls.

## Parameters

### value

`unknown`

The value to validate.

### source?

`string`

Human-readable label for error messages (defaults to `'config'`).

## Returns

[`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

The validated configuration cast to `ZodFormsConfig`.

## Throws

If `value` does not conform to the config schema.

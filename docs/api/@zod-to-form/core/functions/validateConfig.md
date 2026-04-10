[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / validateConfig

# Function: validateConfig()

> **validateConfig**(`value`, `source?`): [`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: [config.ts:442](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/config.ts#L442)

Validates an unknown value as a `ZodFormsConfig` at runtime.

Parses `value` using the internal Zod config schema and throws a descriptive
error if validation fails. Use this when loading config from untrusted sources
such as JSON files or dynamic `import()` calls.

## Parameters

### value

`unknown`

The value to validate.

### source?

`string` = `'config'`

Human-readable label for error messages (defaults to `'config'`).

## Returns

[`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

The validated configuration cast to `ZodFormsConfig`.

## Throws

If `value` does not conform to the config schema.

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / validateConfig

# Function: validateConfig()

> **validateConfig**(`value`, `source?`): [`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: [config.ts:488](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/config.ts#L488)

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

## Use When

- Loading config from JSON files or dynamic import()
- You need runtime validation of user-provided config

## Avoid When

- Using TypeScript with defineConfig() — type errors catch most issues at dev time

## Pitfalls

- NEVER use as a type guard — it throws on invalid input, doesn't narrow
- NEVER assume extra keys cause failures — the schema uses z.object().loose(), extra keys are silently ignored

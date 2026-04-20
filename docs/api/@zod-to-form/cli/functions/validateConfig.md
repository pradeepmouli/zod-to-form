[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / validateConfig

# Function: validateConfig()

> **validateConfig**(`value`, `source?`): [`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: core/dist/config.d.ts:186

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

## Use When

- Loading config from JSON files or dynamic import() where the type is `unknown` — validates and narrows to `ZodFormsConfig`

## Avoid When

- Using TypeScript with defineConfig() — type errors catch most issues at dev time; validateConfig is only needed when the config source is not type-checkable

## Never

- NEVER use as a type guard — it throws on invalid input, doesn't narrow; FIX: wrap in try/catch and branch on success, or check keys manually before calling
- NEVER assume extra keys cause failures — the schema uses z.object().loose(), so unrecognized keys are silently dropped not rejected; FIX: if you need strict key validation, inspect the returned config for unexpected fields manually

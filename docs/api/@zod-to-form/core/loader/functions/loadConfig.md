[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [loader](../README.md) / loadConfig

# Function: loadConfig()

> **loadConfig**(`configPath`): `Promise`\<[`ZodFormsConfig`](../../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>\>

Defined in: [loader/index.ts:197](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/loader/index.ts#L197)

Load and validate a component config file (`z2f.config.ts` or similar).
Returns the normalized form ready to feed into codegen.

## Parameters

### configPath

`string`

Absolute or relative path to the config file to load.

## Returns

`Promise`\<[`ZodFormsConfig`](../../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>\>

The validated and normalized `ZodFormsConfig` from the config file's default export.

## Throws

When the file cannot be read, or the exported config fails `validateConfig`.

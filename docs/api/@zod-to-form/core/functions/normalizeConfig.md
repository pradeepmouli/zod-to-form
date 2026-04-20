[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / normalizeConfig

# Function: normalizeConfig()

> **normalizeConfig**(`config`): [`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: [config.ts:551](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/config.ts#L551)

Normalize a validated config by migrating deprecated top-level fields to their canonical locations.
Currently handles the legacy top-level `overwrite` key — moves it into `defaults.overwrite`
so the rest of the pipeline can assume the normalized shape.

## Parameters

### config

[`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

A fully validated `ZodFormsConfig` (output of `validateConfig`).

## Returns

[`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

The same config with any deprecated top-level fields migrated into `defaults`.

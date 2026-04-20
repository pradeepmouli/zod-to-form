[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / normalizeConfig

# Function: normalizeConfig()

> **normalizeConfig**(`config`): [`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: [config.ts:553](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/config.ts#L553)

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

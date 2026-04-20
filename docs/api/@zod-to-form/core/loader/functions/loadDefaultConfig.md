[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [loader](../README.md) / loadDefaultConfig

# Function: loadDefaultConfig()

> **loadDefaultConfig**(`cwd`): `Promise`\<[`ZodFormsConfig`](../../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\> \| `undefined`\>

Defined in: [loader/index.ts:264](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/loader/index.ts#L264)

Load and validate the default config file from `cwd` by auto-discovering
standard naming candidates (`z2f.config.ts`, `component-config.ts`, etc.).
Returns `undefined` when no config file is found.

## Parameters

### cwd

`string`

The directory to search for a config file.

## Returns

`Promise`\<[`ZodFormsConfig`](../../type-aliases/ZodFormsConfig.md)\<`Record`\<`string`, `unknown`\>\> \| `undefined`\>

The validated and normalized config, or `undefined` if none was found.

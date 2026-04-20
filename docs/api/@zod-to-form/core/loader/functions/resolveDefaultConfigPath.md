[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [loader](../README.md) / resolveDefaultConfigPath

# Function: resolveDefaultConfigPath()

> **resolveDefaultConfigPath**(`cwd`): `Promise`\<`string` \| `undefined`\>

Defined in: [loader/index.ts:235](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/loader/index.ts#L235)

Walk the standard config-file naming candidates in `cwd` and return the
first that exists. Used by the CLI's auto-discovery and (eventually) by
the Vite plugin's config watcher.

## Parameters

### cwd

`string`

The directory to search for a config file.

## Returns

`Promise`\<`string` \| `undefined`\>

The absolute path of the first config file found, or `undefined` if none exists.

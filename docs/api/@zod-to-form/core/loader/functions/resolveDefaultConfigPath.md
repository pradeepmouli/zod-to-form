[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [loader](../README.md) / resolveDefaultConfigPath

# Function: resolveDefaultConfigPath()

> **resolveDefaultConfigPath**(`cwd`): `Promise`\<`string` \| `undefined`\>

Defined in: [loader/index.ts:235](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/loader/index.ts#L235)

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

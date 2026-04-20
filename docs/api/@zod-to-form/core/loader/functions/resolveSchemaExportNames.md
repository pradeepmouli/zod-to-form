[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [loader](../README.md) / resolveSchemaExportNames

# Function: resolveSchemaExportNames()

> **resolveSchemaExportNames**(`schemaPath`): `Promise`\<`string`[]\>

Defined in: [loader/index.ts:178](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/loader/index.ts#L178)

Return the sorted list of named Zod schema exports in a schema file.
Used by the CLI's `--list-exports` flag and the Vite plugin's
ambiguous-export error message.

## Parameters

### schemaPath

`string`

Absolute or relative path to the schema file to inspect.

## Returns

`Promise`\<`string`[]\>

Alphabetically sorted array of export names that are Zod schemas.

[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [loader](../README.md) / resolveSchemaExportNames

# Function: resolveSchemaExportNames()

> **resolveSchemaExportNames**(`schemaPath`): `Promise`\<`string`[]\>

Defined in: [loader/index.ts:178](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/loader/index.ts#L178)

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

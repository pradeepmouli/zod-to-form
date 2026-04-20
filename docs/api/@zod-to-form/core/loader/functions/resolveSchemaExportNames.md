[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [loader](../README.md) / resolveSchemaExportNames

# Function: resolveSchemaExportNames()

> **resolveSchemaExportNames**(`schemaPath`): `Promise`\<`string`[]\>

Defined in: [loader/index.ts:178](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/loader/index.ts#L178)

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

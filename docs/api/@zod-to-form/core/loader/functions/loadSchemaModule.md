[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [loader](../README.md) / loadSchemaModule

# Function: loadSchemaModule()

> **loadSchemaModule**(`schemaPath`): `Promise`\<`Record`\<`string`, `unknown`\>\>

Defined in: [loader/index.ts:156](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/loader/index.ts#L156)

Load a schema file and return the entire module namespace, leaving the
choice of which export to use to the caller. The Vite plugin uses this
variant so it can run its own export-disambiguation pass.

## Parameters

### schemaPath

`string`

Absolute or relative path to the schema file to load.

## Returns

`Promise`\<`Record`\<`string`, `unknown`\>\>

All named exports from the module as a `Record<string, unknown>`.

## Throws

When the file cannot be read or evaluated.

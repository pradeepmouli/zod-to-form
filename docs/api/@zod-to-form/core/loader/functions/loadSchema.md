[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [loader](../README.md) / loadSchema

# Function: loadSchema()

> **loadSchema**(`schemaPath`, `exportName`): `Promise`\<`unknown`\>

Defined in: [loader/index.ts:120](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/loader/index.ts#L120)

Load a single named Zod schema export from a TypeScript or JavaScript
file. Throws with a clear message when the file can't be read, the
export doesn't exist, or the export isn't a Zod schema.

## Parameters

### schemaPath

`string`

Absolute or relative path to the schema file to load.

### exportName

`string`

The named export to extract from the loaded module (e.g. `'UserSchema'`).

## Returns

`Promise`\<`unknown`\>

The Zod schema instance for the named export.

## Throws

When the file cannot be read, the export is missing, or the export is not a Zod schema.

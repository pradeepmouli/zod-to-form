[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / generateSchemaLiteFile

# Function: generateSchemaLiteFile()

> **generateSchemaLiteFile**(`schemaImportPath`, `exportName`, `info`): `string` \| `null`

Defined in: [schema-lite-codegen.ts:82](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/codegen/src/schema-lite-codegen.ts#L82)

Generate the content of a .lite.ts file that constructs a lite schema
from the imported schema's check objects at runtime.

Returns null if no schemaLite is needed (no top-level effects).

## Parameters

### schemaImportPath

`string`

### exportName

`string`

### info

[`SchemaLiteInfo`](../../core/type-aliases/SchemaLiteInfo.md)

## Returns

`string` \| `null`

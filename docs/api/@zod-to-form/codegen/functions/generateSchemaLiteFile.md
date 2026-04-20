[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / generateSchemaLiteFile

# Function: generateSchemaLiteFile()

> **generateSchemaLiteFile**(`schemaImportPath`, `exportName`, `info`): `string` \| `null`

Defined in: [codegen/src/schema-lite-codegen.ts:103](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/codegen/src/schema-lite-codegen.ts#L103)

Generate the content of a `.lite.ts` file that reconstructs a lite Zod schema
from the imported schema's check objects at runtime.
Returns `null` when no schemaLite is needed (no top-level effects were detected).

## Parameters

### schemaImportPath

`string`

Module specifier for the original schema file (e.g. `'./schema'`).

### exportName

`string`

The named schema export (e.g. `'UserSchema'`).

### info

[`SchemaLiteInfo`](../../core/type-aliases/SchemaLiteInfo.md)

Metadata from `WalkResult.schemaLiteInfo` describing what to reconstruct.

## Returns

`string` \| `null`

The complete `.lite.ts` file source, or `null` if no lite schema is needed.

## Remarks

Three reconstruction strategies based on `info.type`:
- `'original'` — re-exports the original schema unchanged (non-decomposable pipes)
- `'checks'` — slices `_zod.def.checks` at runtime to extract superRefine/refine checks
- `'transform'` — extracts both inner checks and the transform function from a pipe wrapper
Fallthrough fields are included in the base object via shape references into the original schema.

## Example

```ts
const liteSource = generateSchemaLiteFile('./schema', 'UserSchema', schemaLiteInfo);
if (liteSource) {
  await writeFile('./UserForm.lite.ts', liteSource, 'utf8');
}
```

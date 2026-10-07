[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / WriteOptions

# Interface: WriteOptions

Defined in: packages/vite/src/types.ts:18

Optional disk-write settings. When omitted, generated forms are served
as virtual modules only (no files written).

## Properties

### filenamePattern?

> `optional` **filenamePattern?**: `string`

Defined in: packages/vite/src/types.ts:28

File naming pattern with substitution tokens.
Default: `'{schemaBasename}.{variant}.generated.tsx'`.

***

### outDir?

> `optional` **outDir?**: `string`

Defined in: packages/vite/src/types.ts:23

Directory for emitted files. If undefined, write each generated file
beside its source schema.

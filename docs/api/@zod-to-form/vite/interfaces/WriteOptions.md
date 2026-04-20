[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / WriteOptions

# Interface: WriteOptions

Defined in: [packages/vite/src/types.ts:73](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/vite/src/types.ts#L73)

Optional disk-write settings. When omitted, generated forms are served
as virtual modules only (no files written).

## Properties

### filenamePattern?

> `optional` **filenamePattern?**: `string`

Defined in: [packages/vite/src/types.ts:83](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/vite/src/types.ts#L83)

File naming pattern with substitution tokens.
Default: `'{schemaBasename}.{variant}.generated.tsx'`.

***

### outDir?

> `optional` **outDir?**: `string`

Defined in: [packages/vite/src/types.ts:78](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/vite/src/types.ts#L78)

Directory for emitted files. If undefined, write each generated file
beside its source schema.

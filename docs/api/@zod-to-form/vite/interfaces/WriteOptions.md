[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / WriteOptions

# Interface: WriteOptions

Defined in: [packages/vite/src/types.ts:73](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/vite/src/types.ts#L73)

Optional disk-write settings. When omitted, generated forms are served
as virtual modules only (no files written).

## Properties

### filenamePattern?

> `optional` **filenamePattern?**: `string`

Defined in: [packages/vite/src/types.ts:83](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/vite/src/types.ts#L83)

File naming pattern with substitution tokens.
Default: `'{schemaBasename}.{variant}.generated.tsx'`.

***

### outDir?

> `optional` **outDir?**: `string`

Defined in: [packages/vite/src/types.ts:78](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/vite/src/types.ts#L78)

Directory for emitted files. If undefined, write each generated file
beside its source schema.

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / CompilationEntry

# Interface: CompilationEntry

Defined in: [packages/vite/src/types.ts:205](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/vite/src/types.ts#L205)

One cached compilation result. The cache stores entries keyed by
`${schemaFile}::${variant}::${configHash}`.

## Properties

### emittedAt

> **emittedAt**: `number`

Defined in: [packages/vite/src/types.ts:222](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/vite/src/types.ts#L222)

`Date.now()` at compile time. Used for debug logging and HMR ordering.

***

### generatedSource

> **generatedSource**: `string`

Defined in: [packages/vite/src/types.ts:210](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/vite/src/types.ts#L210)

The `.tsx` source emitted by `generateFormComponent`.

***

### schemaLiteSource

> **schemaLiteSource**: `string` \| `null`

Defined in: [packages/vite/src/types.ts:216](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/vite/src/types.ts#L216)

The companion `.lite.ts` source emitted by `generateSchemaLiteFile`,
or `null` if the walk produced no top-level effects.

***

### sourceMap

> **sourceMap**: `unknown`

Defined in: [packages/vite/src/types.ts:219](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/vite/src/types.ts#L219)

Reserved for a future sourcemap back to the original schema.

***

### target

> **target**: [`GenerationTarget`](../type-aliases/GenerationTarget.md)

Defined in: [packages/vite/src/types.ts:207](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/vite/src/types.ts#L207)

The triple that produced this entry.

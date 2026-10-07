[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / CompilationEntry

# Interface: CompilationEntry

Defined in: packages/vite/src/types.ts:150

One cached compilation result. The cache stores entries keyed by
`${schemaFile}::${variant}::${configHash}`.

## Properties

### emittedAt

> **emittedAt**: `number`

Defined in: packages/vite/src/types.ts:167

`Date.now()` at compile time. Used for debug logging and HMR ordering.

***

### generatedSource

> **generatedSource**: `string`

Defined in: packages/vite/src/types.ts:155

The `.tsx` source emitted by `generateFormComponent`.

***

### schemaLiteSource

> **schemaLiteSource**: `string` \| `null`

Defined in: packages/vite/src/types.ts:161

The companion `.lite.ts` source emitted by `generateSchemaLiteFile`,
or `null` if the walk produced no top-level effects.

***

### sourceMap

> **sourceMap**: `unknown`

Defined in: packages/vite/src/types.ts:164

Reserved for a future sourcemap back to the original schema.

***

### target

> **target**: [`GenerationTarget`](../type-aliases/GenerationTarget.md)

Defined in: packages/vite/src/types.ts:152

The triple that produced this entry.

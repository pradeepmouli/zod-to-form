[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / GenerateSite

# Interface: GenerateSite

Defined in: [packages/vite/src/types.ts:231](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/vite/src/types.ts#L231)

A single `<ZodForm>` JSX element matched by generate mode.
Lives only during a single `transform` call — not persisted.

## Properties

### exportName

> **exportName**: `string`

Defined in: [packages/vite/src/types.ts:242](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/vite/src/types.ts#L242)

Export name of the identifier in the schema module.

***

### generatedIdentifier

> **generatedIdentifier**: `string`

Defined in: [packages/vite/src/types.ts:248](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/vite/src/types.ts#L248)

Local identifier that replaces `ZodForm` at this call site.
Unique within the source file.

***

### range

> **range**: `object`

Defined in: [packages/vite/src/types.ts:236](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/vite/src/types.ts#L236)

Byte range of the original `<ZodForm>` element in the source file.

#### end

> **end**: `number`

#### start

> **start**: `number`

***

### schemaFile

> **schemaFile**: `string`

Defined in: [packages/vite/src/types.ts:239](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/vite/src/types.ts#L239)

Absolute path to the schema file the `schema={X}` identifier resolves to.

***

### sourceFile

> **sourceFile**: `string`

Defined in: [packages/vite/src/types.ts:233](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/vite/src/types.ts#L233)

Absolute path to the source file containing the matched `<ZodForm>` site.

***

### variant

> **variant**: `string`

Defined in: [packages/vite/src/types.ts:254](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/vite/src/types.ts#L254)

Synthesized variant name for cache keying. Always `__generate_<n>` where
`<n>` is a per-source-file counter.

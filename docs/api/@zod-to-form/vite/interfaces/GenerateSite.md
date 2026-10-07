[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / GenerateSite

# Interface: GenerateSite

Defined in: packages/vite/src/types.ts:176

A single `<ZodForm>` JSX element matched by generate mode.
Lives only during a single `transform` call — not persisted.

## Properties

### exportName

> **exportName**: `string`

Defined in: packages/vite/src/types.ts:187

Export name of the identifier in the schema module.

***

### generatedIdentifier

> **generatedIdentifier**: `string`

Defined in: packages/vite/src/types.ts:193

Local identifier that replaces `ZodForm` at this call site.
Unique within the source file.

***

### range

> **range**: `object`

Defined in: packages/vite/src/types.ts:181

Byte range of the original `<ZodForm>` element in the source file.

#### end

> **end**: `number`

#### start

> **start**: `number`

***

### schemaFile

> **schemaFile**: `string`

Defined in: packages/vite/src/types.ts:184

Absolute path to the schema file the `schema={X}` identifier resolves to.

***

### sourceFile

> **sourceFile**: `string`

Defined in: packages/vite/src/types.ts:178

Absolute path to the source file containing the matched `<ZodForm>` site.

***

### variant

> **variant**: `string`

Defined in: packages/vite/src/types.ts:199

Synthesized variant name for cache keying. Always `__generate_<n>` where
`<n>` is a per-source-file counter.

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / WalkOptions

# Interface: WalkOptions

Defined in: packages/core/dist/types.d.ts:125

## Properties

### formRegistry?

> `optional` **formRegistry?**: [`ZodFormRegistry`](../../core/type-aliases/ZodFormRegistry.md)

Defined in: packages/core/dist/types.d.ts:127

Custom form registry for metadata annotations

***

### maxDepth?

> `optional` **maxDepth?**: `number`

Defined in: packages/core/dist/types.d.ts:131

Maximum recursion depth for lazy/recursive schemas (default: 5)

***

### processors?

> `optional` **processors?**: `Record`\<`string`, [`FormProcessor`](../../core/type-aliases/FormProcessor.md)\>

Defined in: packages/core/dist/types.d.ts:129

Custom processors to add or override built-in ones

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / WalkOptions

# Interface: WalkOptions

Defined in: packages/core/dist/types.d.ts:175

## Properties

### formRegistry?

> `optional` **formRegistry?**: [`ZodFormRegistry`](../../core/type-aliases/ZodFormRegistry.md)

Defined in: packages/core/dist/types.d.ts:177

Custom form registry for metadata annotations

***

### maxDepth?

> `optional` **maxDepth?**: `number`

Defined in: packages/core/dist/types.d.ts:181

Maximum recursion depth for lazy/recursive schemas (default: 5)

***

### optimization?

> `optional` **optimization?**: `object`

Defined in: packages/core/dist/types.d.ts:190

Validation optimization settings.

This is the walker's API surface — callers (useZodForm, CLI codegen) pass
the optimization config here. The CLI reads `config.defaults.optimization`
and forwards it; useZodForm accepts it via its own options. Both converge
here as the single source of truth for the walker.

#### level

> **level**: `1` \| `2` \| `3`

#### optimizers?

> `optional` **optimizers?**: `Record`\<`string`, [`FormOptimizer`](../../core/type-aliases/FormOptimizer.md)[]\>

***

### processors?

> `optional` **processors?**: `Record`\<`string`, [`FormProcessor`](../../core/type-aliases/FormProcessor.md)\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>\>

Defined in: packages/core/dist/types.d.ts:179

Custom processors to add or override built-in ones

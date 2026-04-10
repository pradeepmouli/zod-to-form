[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / WalkOptions

# Interface: WalkOptions

Defined in: [types.ts:210](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L210)

## Properties

### formRegistry?

> `optional` **formRegistry?**: [`ZodFormRegistry`](../type-aliases/ZodFormRegistry.md)

Defined in: [types.ts:212](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L212)

Custom form registry for metadata annotations

***

### maxDepth?

> `optional` **maxDepth?**: `number`

Defined in: [types.ts:216](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L216)

Maximum recursion depth for lazy/recursive schemas (default: 5)

***

### optimization?

> `optional` **optimization?**: `object`

Defined in: [types.ts:225](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L225)

Validation optimization settings.

This is the walker's API surface — callers (useZodForm, CLI codegen) pass
the optimization config here. The CLI reads `config.defaults.optimization`
and forwards it; useZodForm accepts it via its own options. Both converge
here as the single source of truth for the walker.

#### level

> **level**: `1` \| `2` \| `3`

#### optimizers?

> `optional` **optimizers?**: `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

***

### processors?

> `optional` **processors?**: `Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>\>

Defined in: [types.ts:214](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L214)

Custom processors to add or override built-in ones

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / WalkOptions

# Interface: WalkOptions

Defined in: types.ts:376

## Properties

### formRegistry?

> `optional` **formRegistry?**: [`ZodFormRegistry`](../type-aliases/ZodFormRegistry.md)

Defined in: types.ts:378

Custom form registry for metadata annotations

***

### maxDepth?

> `optional` **maxDepth?**: `number`

Defined in: types.ts:382

Maximum recursion depth for lazy/recursive schemas (default: 5)

***

### optimization?

> `optional` **optimization?**: [`OptimizationConfig`](../type-aliases/OptimizationConfig.md) & `object`

Defined in: types.ts:391

Validation optimization settings.

This is the walker's API surface — callers (useZodForm, CLI codegen) pass
the optimization config here. The CLI reads `config.defaults.optimization`
and forwards it; useZodForm accepts it via its own options. Both converge
here as the single source of truth for the walker.

#### Type Declaration

##### optimizers?

> `optional` **optimizers?**: `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

***

### processors?

> `optional` **processors?**: `Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>\>

Defined in: types.ts:380

Custom processors to add or override built-in ones

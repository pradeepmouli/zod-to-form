[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / createOptimizers

# Function: createOptimizers()

> **createOptimizers**(`custom?`): `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

Defined in: [optimizers/index.ts:43](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/optimizers/index.ts#L43)

Create an optimizer registry by merging custom optimizers with builtins.
Custom optimizers for a type replace the entire chain for that type.

## Parameters

### custom?

`Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\> = `{}`

## Returns

`Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

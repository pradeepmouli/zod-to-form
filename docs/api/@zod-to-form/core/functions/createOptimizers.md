[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / createOptimizers

# Function: createOptimizers()

> **createOptimizers**(`custom?`): `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

Defined in: [optimizers/index.ts:49](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/optimizers/index.ts#L49)

Create an optimizer registry by merging custom optimizers with builtins.
Custom optimizers for a type replace the entire chain for that type.

## Parameters

### custom?

`Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\> = `{}`

## Returns

`Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

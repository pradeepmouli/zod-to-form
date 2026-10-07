[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / builtinOptimizers

# Variable: builtinOptimizers

> `const` **builtinOptimizers**: `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

Defined in: optimizers/index.ts:50

The default optimizer registry — L1 (decompose) + L2 (native rules) chains merged per type.
Keyed by `def.type`; each entry is an ordered chain of optimizers applied left-to-right.
NEVER mutate this directly — use `createOptimizers(custom)` to extend.

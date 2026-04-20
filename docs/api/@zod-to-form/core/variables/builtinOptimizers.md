[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / builtinOptimizers

# Variable: builtinOptimizers

> `const` **builtinOptimizers**: `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

Defined in: [optimizers/index.ts:50](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/core/src/optimizers/index.ts#L50)

The default optimizer registry — L1 (decompose) + L2 (native rules) chains merged per type.
Keyed by `def.type`; each entry is an ordered chain of optimizers applied left-to-right.
NEVER mutate this directly — use `createOptimizers(custom)` to extend.

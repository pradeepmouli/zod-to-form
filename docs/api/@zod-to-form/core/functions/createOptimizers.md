[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / createOptimizers

# Function: createOptimizers()

> **createOptimizers**(`custom?`): `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

Defined in: [optimizers/index.ts:68](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/index.ts#L68)

Create an optimizer registry by merging custom optimizers with builtins.
Custom optimizers for a type replace the entire chain for that type.

## Parameters

### custom?

`Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\> = `{}`

## Returns

`Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

## Remarks

Creates an optimizer registry by merging custom optimizers with built-in L1/L2 chains.
L1 stores per-field zodSchema for decomposed validation.
L2 generates native HTML validation rules (minLength, pattern, etc.).
Custom optimizers for a type REPLACE the entire chain — they don't append.

## Use When

- You want per-field validation instead of whole-form validation
- You need native HTML validation attributes (required, minLength, pattern)

## Avoid When

- You only need whole-schema validation — omit the optimization option entirely

## Pitfalls

- NEVER mutate builtinOptimizers — it's a module singleton. Always use createOptimizers(custom)
- NEVER assume custom optimizers append — they REPLACE the entire chain for that type

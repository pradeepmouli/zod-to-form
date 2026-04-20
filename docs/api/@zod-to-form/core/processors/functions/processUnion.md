[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processUnion

# Function: processUnion()

> **processUnion**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/union.ts:50](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/processors/union.ts#L50)

Process `z.union()` — renders as a `Select` when all options are literals,
or delegates to `processDiscriminatedUnion` when a discriminator property is detected.
Falls back to a plain `Input` for mixed unions.

## Parameters

### schema

`$ZodUnion`

The `$ZodUnion` schema to process.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context (used by discriminated union delegation).

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Parent path metadata for discriminated union child keys.

## Returns

`void`

## Remarks

Discriminated unions have `def.type === "union"` in Zod v4 — they are detected
by the presence of a `discriminator` property in the def. This processor handles both.

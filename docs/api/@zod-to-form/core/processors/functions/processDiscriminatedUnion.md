[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processDiscriminatedUnion

# Function: processDiscriminatedUnion()

> **processDiscriminatedUnion**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/union.ts:101](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/processors/union.ts#L101)

Process `z.discriminatedUnion()` — renders as a `Select` for the discriminator field,
with variant child fields stored in `field.props._variants` for runtime conditional rendering.
The runtime `DiscriminatedUnionBlock` and codegen both read `_discriminator` and `_variants`.

## Parameters

### schema

`$ZodDiscriminatedUnion`

The `$ZodDiscriminatedUnion` schema to process.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing child processing for variant shape entries.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Parent path metadata for constructing variant child field keys.

## Returns

`void`

## Remarks

The discriminator select options are derived from the literal values in each variant's
discriminator field. Variant child fields (excluding the discriminator key) are pre-processed
and stored keyed by their discriminator value string.

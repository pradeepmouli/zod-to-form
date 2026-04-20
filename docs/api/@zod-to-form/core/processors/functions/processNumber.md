[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processNumber

# Function: processNumber()

> **processNumber**(`schema`, `_ctx`, `field`, `_params`): `void`

Defined in: [processors/number.ts:16](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/processors/number.ts#L16)

Process `z.number()` / `z.bigint()` — renders as a numeric `Input` with `type="number"`.
Extracts `min`/`max` from the constraint bag and detects integer constraints from `def.checks`.
Sets `step=1` when an integer constraint is detected.

## Parameters

### schema

`$ZodNumber`\<`unknown`\> \| `$ZodBigInt`\<`unknown`\>

The `$ZodNumber` or `$ZodBigInt` schema to process.

### \_ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context (unused for number processing).

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processString

# Function: processString()

> **processString**(`schema`, `ctx`, `field`, `_params`): `void`

Defined in: [processors/string.ts:35](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/processors/string.ts#L35)

Process `z.string()` — renders as an `Input` (or `DatePicker` for date/time formats).
Extracts format, minLength, maxLength, and pattern constraints from the constraint bag.
Converts regex patterns to input masks via `regexToMask` when possible.

## Parameters

### schema

`$ZodString`

The `$ZodString` schema to process.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing the form registry for component overrides.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### \_params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Unused; included for processor signature conformance.

## Returns

`void`

## Remarks

Format-to-input-type mapping: `email` → `type="email"`, `url` → `type="url"`,
`date`/`time`/`datetime` → `DatePicker` component. Other formats fall through to `type="text"`.
Pattern is extracted from `bag.patterns` (a `Set<RegExp>`); only the first pattern is used.

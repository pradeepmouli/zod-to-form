# Functions

## Processors

### `processNumber`
Process `z.number()` / `z.bigint()` — renders as a numeric `Input` with `type="number"`.
Extracts `min`/`max` from the constraint bag and detects integer constraints from `def.checks`.
Sets `step=1` when an integer constraint is detected.
```ts
processNumber(schema: $ZodNumber<unknown> | $ZodBigInt<unknown>, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodNumber<unknown> | $ZodBigInt<unknown>` — The `$ZodNumber` or `$ZodBigInt` schema to process.
- `_ctx: FormProcessorContext` — The walker context (unused for number processing).
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.

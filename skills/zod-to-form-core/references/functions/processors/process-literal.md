# Functions

## Processors

### `processLiteral`
Process `z.literal()` — renders as a read-only `Select` with a single fixed option.
The field is marked `readOnly` because literal fields have exactly one valid value.
```ts
processLiteral(schema: $ZodLiteral, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodLiteral` — The `$ZodLiteral` schema whose values define the select options.
- `_ctx: FormProcessorContext` — The walker context (unused for literal processing).
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.

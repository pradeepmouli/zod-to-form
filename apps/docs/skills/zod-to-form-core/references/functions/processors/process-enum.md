# Functions

## Processors

### `processEnum`
Process `z.enum()` — renders as a `Select` component with options derived from enum entries.
Duplicate values are deduplicated, and labels are generated via `inferLabel`.
```ts
processEnum(schema: $ZodEnum, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodEnum` — The `$ZodEnum` schema whose entries define the select options.
- `_ctx: FormProcessorContext` — The walker context (unused for enum processing).
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.

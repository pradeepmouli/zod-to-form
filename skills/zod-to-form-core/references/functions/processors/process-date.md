# Functions

## Processors

### `processDate`
Process `z.date()` / `z.iso.date()` — renders as a `DatePicker` component.
No constraints are extracted from the date schema — date validation is handled by the resolver.
```ts
processDate(_schema: $ZodDate<unknown> | $ZodISODate, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `_schema: $ZodDate<unknown> | $ZodISODate` — The date schema (unused; date type has no constraint bag entries).
- `_ctx: FormProcessorContext` — The walker context (unused for date processing).
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.

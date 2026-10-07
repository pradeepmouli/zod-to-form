# Functions

## Processors

### `processRecord`
Process `z.record()` — renders as a plain `Input` with an item template derived from the value type.
The item template is stored in `field.arrayItem` for codegen to use in dynamic key-value entry forms.
```ts
processRecord(schema: $ZodRecord, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodRecord` — The `$ZodRecord` schema whose `valueType` drives the item template.
- `_ctx: FormProcessorContext` — The walker context (unused for record processing).
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.

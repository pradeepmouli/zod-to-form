# Functions

## Processors

### `processFile`
Process `z.file()` — renders as a `FileInput` component.
No constraints are extracted. The field renderer sets `valueAsFile: true` on registration
so RHF stores a `File` object rather than the raw input value.
```ts
processFile(_schema: $ZodType, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `_schema: $ZodType` — The file schema (unused; no bag constraints for files).
- `_ctx: FormProcessorContext` — The walker context (unused for file processing).
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.

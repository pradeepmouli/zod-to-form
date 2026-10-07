# Functions

## Processors

### `processTemplateLiteral`
Process `z.templateLiteral()` — renders as a plain text `Input`.
Template literals have a fixed structure; no constraints are extracted.
```ts
processTemplateLiteral(schema: $ZodTemplateLiteral, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodTemplateLiteral` — The `$ZodTemplateLiteral` schema to process.
- `_ctx: FormProcessorContext` — The walker context (unused for template literal processing).
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.

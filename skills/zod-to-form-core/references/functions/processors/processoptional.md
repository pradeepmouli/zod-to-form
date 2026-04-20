# Functions

## Processors

### `processOptional`
Process `z.optional()` — unwraps to the inner type and marks the field as not required.
Delegates to the inner type's processor for all component and constraint extraction.
```ts
processOptional(schema: $ZodOptional, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodOptional` — The `$ZodOptional` schema to unwrap.
- `ctx: FormProcessorContext` — The walker context providing the processor registry for inner type dispatch.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata passed through to the inner processor.

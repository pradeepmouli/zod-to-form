# Functions

## Processors

### `processPipe`
Process `z.pipe()` — unwraps to the input type and delegates to its processor.
The output/transform side is handled by the L1 optimizer for submit-time validation.
```ts
processPipe(schema: $ZodPipe, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodPipe` — The `$ZodPipe` schema whose `in` type drives the rendered field.
- `ctx: FormProcessorContext` — The walker context providing the processor registry for inner type dispatch.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata passed through to the inner processor.

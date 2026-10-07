# Functions

## Processors

### `processIntersection`
Process `z.intersection()` — renders as a `Fieldset` that merges the left and right shape entries.
Both the left and right schemas must be `z.object()` types for their shapes to be merged.
Non-object intersection members are silently skipped.
```ts
processIntersection(schema: $ZodIntersection, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodIntersection` — The `$ZodIntersection` schema whose left/right shapes are merged.
- `ctx: FormProcessorContext` — The walker context providing child processing.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata for constructing nested field keys.

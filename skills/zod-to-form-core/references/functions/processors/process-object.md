# Functions

## Processors

### `processObject`
Process `z.object()` — renders as a `Fieldset` with each shape key as a child field.
Recursively processes all shape entries via `ctx.processChild`.

The fieldset label is inferred from `params.parentKey` or `field.key` via `inferLabel`.
Schema-level metadata (title, description) can override the inferred label via `resolveMetadata`.
```ts
processObject(schema: $ZodObject, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodObject` — The `$ZodObject` schema whose shape defines the child fields.
- `ctx: FormProcessorContext` — The walker context providing child processing.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata for constructing nested field keys.

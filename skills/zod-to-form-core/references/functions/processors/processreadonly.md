# Functions

## Processors

### `processReadonly`
Process `z.readonly()` — marks the field as read-only and delegates to the inner type.
The rendered component receives `readOnly: true` via the base field props.
```ts
processReadonly(schema: $ZodReadonly, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodReadonly` — The `$ZodReadonly` schema to unwrap.
- `ctx: FormProcessorContext` — The walker context providing the processor registry for inner type dispatch.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata passed through to the inner processor.

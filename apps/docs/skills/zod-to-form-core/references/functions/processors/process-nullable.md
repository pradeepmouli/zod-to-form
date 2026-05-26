# Functions

## Processors

### `processNullable`
Process `z.nullable()` — unwraps to the inner type and marks the field as not required.
Nullable fields accept null in addition to the inner type; the field renders normally.
```ts
processNullable(schema: $ZodNullable, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodNullable` — The `$ZodNullable` schema to unwrap.
- `ctx: FormProcessorContext` — The walker context providing the processor registry for inner type dispatch.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata passed through to the inner processor.

# Functions

## Processors

### `processSet`
Process `z.set()` — renders as an array-like repeater of unique items.
The value type determines the item template stored in `field.arrayItem`.
```ts
processSet(schema: $ZodSet, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodSet` — The `$ZodSet` schema whose `valueType` drives the item template.
- `ctx: FormProcessorContext` — The walker context providing child processing.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata for constructing the item template key.

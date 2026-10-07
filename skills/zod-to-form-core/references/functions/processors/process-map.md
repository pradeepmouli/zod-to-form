# Functions

## Processors

### `processMap`
Process `z.map()` — renders as an array-like repeater of key-value pair fieldsets.
Each entry has a `key` field and a `value` field derived from the Map's type params.
```ts
processMap(schema: $ZodMap, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodMap` — The `$ZodMap` schema whose `keyType` and `valueType` drive the entry fieldset.
- `ctx: FormProcessorContext` — The walker context providing child processing for key and value fields.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata for constructing the entry fieldset key.

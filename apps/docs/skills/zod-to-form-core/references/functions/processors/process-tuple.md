# Functions

## Processors

### `processTuple`
Process `z.tuple()` — renders as a `Fieldset` where each tuple item becomes a child field.
Tuple items are keyed by their index (e.g. `"tupleField.0"`, `"tupleField.1"`).

Fixed-length tuples render all items eagerly. Rest elements are not currently supported
and will produce an empty children array if present.
```ts
processTuple(schema: $ZodTuple, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodTuple` — The `$ZodTuple` schema to process.
- `ctx: FormProcessorContext` — The walker context providing child processing.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata for constructing item keys.

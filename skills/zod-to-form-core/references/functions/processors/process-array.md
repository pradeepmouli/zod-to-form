# Functions

## Processors

### `processArray`
Process `z.array()` — renders as an `ArrayField` component with an item template.
Extracts `minLength`/`maxLength` from the constraint bag and recurses on the element type.

The item template is constructed at key `parentKey.0` (first index).
The runtime ArrayBlock and codegen both use `field.arrayItem` to build the repeater.
```ts
processArray(schema: $ZodArray, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodArray` — The `$ZodArray` schema to process.
- `ctx: FormProcessorContext` — The walker context providing processor registry and child processing.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata for constructing the item template key.

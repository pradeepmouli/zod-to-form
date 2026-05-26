# Functions

## Processors

### `processDiscriminatedUnion`
Process `z.discriminatedUnion()` — renders as a `Select` for the discriminator field,
with variant child fields stored in `field.props._variants` for runtime conditional rendering.
The runtime `DiscriminatedUnionBlock` and codegen both read `_discriminator` and `_variants`.

The discriminator select options are derived from the literal values in each variant's
discriminator field. Variant child fields (excluding the discriminator key) are pre-processed
and stored keyed by their discriminator value string.
```ts
processDiscriminatedUnion(schema: $ZodDiscriminatedUnion, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodDiscriminatedUnion` — The `$ZodDiscriminatedUnion` schema to process.
- `ctx: FormProcessorContext` — The walker context providing child processing for variant shape entries.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata for constructing variant child field keys.

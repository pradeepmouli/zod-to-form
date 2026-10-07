# Functions

## Processors

### `processUnion`
Process `z.union()` — renders as a `Select` when all options are literals,
or delegates to `processDiscriminatedUnion` when a discriminator property is detected.
Falls back to a plain `Input` for mixed unions.

Discriminated unions have `def.type === "union"` in Zod v4 — they are detected
by the presence of a `discriminator` property in the def. This processor handles both.
```ts
processUnion(schema: $ZodUnion, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodUnion` — The `$ZodUnion` schema to process.
- `ctx: FormProcessorContext` — The walker context (used by discriminated union delegation).
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata for discriminated union child keys.

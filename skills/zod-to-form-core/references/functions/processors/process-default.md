# Functions

## Processors

### `processDefault`
Process `z.default()` / `z.prefault()` — extracts the default value and delegates to the inner type.
Sets `field.defaultValue` from the schema's default (evaluating functions eagerly).
```ts
processDefault(schema: $ZodDefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>> | $ZodPrefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodDefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>> | $ZodPrefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>` — The `$ZodDefault` or `$ZodPrefault` schema to unwrap.
- `ctx: FormProcessorContext` — The walker context providing the processor registry for inner type dispatch.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata passed through to the inner processor.

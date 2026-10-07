# Functions

## Processors

### `processBoolean`
Process `z.boolean()` — renders as a `Checkbox` component (or a component override from the registry).
Marks the field as required since boolean fields always have a value (true/false).

Component can be overridden via `z.registry&lt;FormMeta&gt;()` with `{ component: 'Switch' }`.
The `required: true` default reflects that a boolean always resolves to true or false — never undefined.
```ts
processBoolean(schema: $ZodBoolean, ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodBoolean` — The `$ZodBoolean` schema to process.
- `ctx: FormProcessorContext` — The walker context providing the form registry for component overrides.
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.

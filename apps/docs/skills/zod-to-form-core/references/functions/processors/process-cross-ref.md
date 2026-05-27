# Functions

## Processors

### `processCrossRef`
Process a cross-reference field — a schema annotated in the form registry with `refType`.
Renders as a `cross-ref` component placeholder that the consuming application resolves
to a form-linked picker or relationship field at runtime.

Cross-ref is not a built-in Zod type — it is activated by registering a schema in the form
registry with `{ props: { refType: 'EntityName' } }` and manually mapping it in the processor
registry to `processCrossRef`. The component name `"cross-ref"` must be mapped in the component module.
```ts
processCrossRef(schema: $ZodType, ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodType` — The Zod schema annotated with `{ props: { refType: 'EntityName' } }` in the registry.
- `ctx: FormProcessorContext` — The walker context providing the form registry for metadata lookup.
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.

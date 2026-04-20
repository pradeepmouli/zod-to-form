# Functions

## Processors

### `processFallback`
Fallback processor for Zod types without a dedicated handler.
Renders as a plain text `Input`, preserving the schema's `def.type` on the field.
Used for `custom`, `any`, `unknown`, `nan`, `void`, `null`, `undefined`, `symbol`,
`transform`, `promise`, `function`, and other exotic types.
```ts
processFallback(schema: $ZodType, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodType` — The unhandled Zod schema.
- `_ctx: FormProcessorContext` — The walker context (unused by the fallback).
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.

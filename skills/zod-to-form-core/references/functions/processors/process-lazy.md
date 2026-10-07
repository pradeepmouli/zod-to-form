# Functions

## Processors

### `processLazy`
Process `z.lazy()` — evaluates the lazy getter and delegates to the inner schema's processor.
Guards against infinite recursion using `ctx.currentDepth` / `ctx.maxDepth` and the `seen` WeakSet.
Renders as a plain text `Input` when the depth limit is reached or the schema is cyclic.
```ts
processLazy(schema: $ZodLazy, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodLazy` — The `$ZodLazy` schema whose getter is evaluated on first encounter.
- `ctx: FormProcessorContext` — The walker context providing depth tracking, cycle detection, and processor dispatch.
- `field: FormField` — The base FormField to mutate in-place.
- `params: ProcessParams` — Parent path metadata passed through to the inner processor.

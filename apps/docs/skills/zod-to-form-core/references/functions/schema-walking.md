# Functions

## Schema Walking

### `walkSchema`
Walk a Zod schema and produce a FormField[] tree.
When optimization option is set, returns WalkResult with fields + schemaLite.

Recursively walks a Zod schema tree and produces a FormField[] intermediate
representation. Dispatches by def.type to a processor registry. Each processor
extracts structure and constraints from _zod.def + _zod.bag.
Uses WeakSet per top-level field for cycle detection — reused schema instances
(e.g., z.string() in two fields) don't trigger false positives.
The walker is STATELESS — call it repeatedly with different formRegistry values.
```ts
walkSchema(schema: $ZodType, options: WalkOptions & { optimization: { level: 1 | 2 | 3 } }): WalkResult
```
**Parameters:**
- `schema: $ZodType` — The Zod schema to walk. Must be a `z.object()` (or pipe-wrapped object) at the root.
- `options: WalkOptions & { optimization: { level: 1 | 2 | 3 } }` — Optional walk options including formRegistry, custom processors, maxDepth, and optimization config.
**Returns:** `WalkResult` — A sorted `FormField[]` array, or a `WalkResult` with `fields` + `schemaLite` when optimization is requested.
**Overloads:**
```ts
walkSchema(schema: $ZodType, options?: WalkOptions): FormField[]
```

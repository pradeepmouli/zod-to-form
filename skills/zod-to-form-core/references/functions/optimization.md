# Functions

## Optimization

### `createOptimizers`
Create an optimizer registry by merging custom optimizers with builtins.
Custom optimizers for a type replace the entire chain for that type.

Creates an optimizer registry by merging custom optimizers with built-in L1/L2 chains.
L1 stores per-field zodSchema for decomposed validation.
L2 generates native HTML validation rules (minLength, pattern, etc.).
Custom optimizers for a type REPLACE the entire chain — they don't append.
```ts
createOptimizers(custom: Record<string, FormOptimizer[]>): Record<string, FormOptimizer[]>
```
**Parameters:**
- `custom: Record<string, FormOptimizer[]>` — default: `{}` — Custom optimizer chains keyed by Zod `def.type`. Each entry replaces the entire built-in chain for that type.
**Returns:** `Record<string, FormOptimizer[]>` — A merged optimizer registry combining built-in and custom chains, ready to pass via `walkSchema` options.

### `createSchemaLiteCollector`
Create a new SchemaLiteCollector instance.

Builds a "lite" schema for submit-time validation:
- Checks (superRefine/refine): z.object({}).loose().check(c1).check(c2)
- Transforms: z.object({}).loose().check(...).transform(fn)
- Non-decomposable pipes: original schema as-is
```ts
createSchemaLiteCollector(options?: { useAnyBase?: boolean }): SchemaLiteCollector
```
**Parameters:**
- `options: { useAnyBase?: boolean }` (optional) — Optional configuration for the collector base type.
**Returns:** `SchemaLiteCollector` — A fresh `SchemaLiteCollector` ready to accumulate checks, transforms, and fallthrough fields.

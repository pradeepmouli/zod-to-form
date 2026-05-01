# Functions

## Utilities

### `isZodSchema`
Structural Zod v4 check shared across loader/registration/codegen entrypoints.

The project intentionally duck-types on a non-null `_zod` object so callers
do not depend on a specific runtime `zod` instance or `instanceof` behavior.
```ts
isZodSchema(value: unknown): value is $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>
```
**Parameters:**
- `value: unknown`
**Returns:** `value is $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>`

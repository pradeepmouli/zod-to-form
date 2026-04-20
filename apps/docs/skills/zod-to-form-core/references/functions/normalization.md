# Functions

## Normalization

### `normalizeFormValues`
Normalize raw HTML form values for Zod parsing.

HTML inputs produce values that don't match Zod's expectations:
- Empty strings "" for unset optional fields (Zod .optional() accepts undefined, not "")
- FileList objects for file inputs (Zod expects File or undefined)

This function recursively normalizes these mismatches so that
schema.safeParse(normalizeFormValues(values)) works correctly.

Called unconditionally in the resolver wrapper to ensure consistent
behavior across all component libraries. While shadcn components handle
most value conversions natively, normalization provides a safety net for
edge cases like FileList objects.

Handles two critical HTML-to-Zod mismatches:
1. Empty strings "" (from unset inputs) → undefined (what Zod .optional() expects)
2. FileList → File | undefined (assumes single-file inputs)
Recursively applies to arrays and nested objects.
```ts
normalizeFormValues(value: unknown): unknown
```
**Parameters:**
- `value: unknown` — The raw form value to normalize (may be nested object, array, string, or FileList).
**Returns:** `unknown` — The normalized value with empty strings replaced by `undefined` and FileList unwrapped.

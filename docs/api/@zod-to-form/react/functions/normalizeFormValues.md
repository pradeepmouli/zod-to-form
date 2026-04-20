[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / normalizeFormValues

# Function: normalizeFormValues()

> **normalizeFormValues**(`value`): `unknown`

Defined in: packages/core/dist/normalize.d.ts:36

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

## Parameters

### value

`unknown`

The raw form value to normalize (may be nested object, array, string, or FileList).

## Returns

`unknown`

The normalized value with empty strings replaced by `undefined` and FileList unwrapped.

## Remarks

Handles two critical HTML-to-Zod mismatches:
1. Empty strings "" (from unset inputs) → undefined (what Zod .optional() expects)
2. FileList → File | undefined (assumes single-file inputs)
Recursively applies to arrays and nested objects.

## Use When

- ALWAYS call on form values before schema.safeParse() in runtime mode — HTML inputs produce `""` for unset optional fields, which Zod rejects; this is the single mandatory normalization step

## Avoid When

- CLI codegen mode — generated components call normalization internally; calling it again is safe (idempotent) but redundant

## Never

- NEVER rely on this for custom types (Date, File subclasses, etc.) — it only handles empty strings and FileList; FIX: normalize custom types before calling this function or in a custom resolver wrapper

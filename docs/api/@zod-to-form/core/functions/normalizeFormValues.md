[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / normalizeFormValues

# Function: normalizeFormValues()

> **normalizeFormValues**(`value`): `unknown`

Defined in: [normalize.ts:36](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/normalize.ts#L36)

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

## Returns

`unknown`

## Remarks

Handles two critical HTML-to-Zod mismatches:
1. Empty strings "" (from unset inputs) → undefined (what Zod .optional() expects)
2. FileList → File | undefined (assumes single-file inputs)
Recursively applies to arrays and nested objects.

## Use When

- ALWAYS call on form values before schema.safeParse() in runtime mode
- Critical for optional fields where HTML produces "" but Zod expects undefined

## Avoid When

- CLI codegen mode — generated components handle normalization internally
- Your form library already normalizes (but calling it anyway is safe — it's idempotent)

## Pitfalls

- NEVER skip this in runtime mode — optional fields will fail validation with "expected string, received string" errors that are extremely confusing to debug
- NEVER rely on it for custom types (Date, etc.) — only handles strings and FileList

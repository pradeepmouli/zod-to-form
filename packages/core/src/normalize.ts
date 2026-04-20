/**
 * Normalize raw HTML form values for Zod parsing.
 *
 * HTML inputs produce values that don't match Zod's expectations:
 * - Empty strings "" for unset optional fields (Zod .optional() accepts undefined, not "")
 * - FileList objects for file inputs (Zod expects File or undefined)
 *
 * This function recursively normalizes these mismatches so that
 * schema.safeParse(normalizeFormValues(values)) works correctly.
 *
 * Called unconditionally in the resolver wrapper to ensure consistent
 * behavior across all component libraries. While shadcn components handle
 * most value conversions natively, normalization provides a safety net for
 * edge cases like FileList objects.
 *
 * @remarks
 * Handles two critical HTML-to-Zod mismatches:
 * 1. Empty strings "" (from unset inputs) → undefined (what Zod .optional() expects)
 * 2. FileList → File | undefined (assumes single-file inputs)
 * Recursively applies to arrays and nested objects.
 *
 * @useWhen
 * - ALWAYS call on form values before schema.safeParse() in runtime mode
 * - Critical for optional fields where HTML produces "" but Zod expects undefined
 *
 * @avoidWhen
 * - CLI codegen mode — generated components handle normalization internally
 * - Your form library already normalizes (but calling it anyway is safe — it's idempotent)
 *
 * @pitfalls
 * - NEVER skip `normalizeFormValues()` in runtime mode — optional fields will fail validation with "expected string, received string" errors that are extremely confusing to debug
 * - NEVER rely on `normalizeFormValues()` for custom types (Date, etc.) — only handles strings and FileList
 *
 * @param value - The raw form value to normalize (may be nested object, array, string, or FileList).
 * @returns The normalized value with empty strings replaced by `undefined` and FileList unwrapped.
 *
 * @category Normalization
 */
export function normalizeFormValues(value: unknown): unknown {
  if (isFileListLike(value)) {
    return value.length > 0 ? (value.item(0) ?? value[0]) : undefined;
  }

  if (value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeFormValues(item));
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      normalizeFormValues(nested)
    ]);

    return Object.fromEntries(entries);
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.prototype.toString.call(value) === '[object Object]';
}

function isFileListLike(value: unknown): value is FileList & { [index: number]: File } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as {
    length?: unknown;
    item?: unknown;
  };

  return typeof candidate.length === 'number' && typeof candidate.item === 'function';
}

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
 * Only needed for plain HTML components. Shadcn and other component
 * libraries handle empty values natively — skip normalization when
 * using a managed preset.
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

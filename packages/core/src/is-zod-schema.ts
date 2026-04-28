import type { $ZodType } from 'zod/v4/core';

/**
 * Structural Zod v4 check shared across loader/registration/codegen entrypoints.
 *
 * The project intentionally duck-types on a non-null `_zod` object so callers
 * do not depend on a specific runtime `zod` instance or `instanceof` behavior.
 *
 * @category Utilities
 */
export function isZodSchema(value: unknown): value is $ZodType {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const zodInternal = (value as { _zod?: unknown })._zod;
  return typeof zodInternal === 'object' && zodInternal !== null;
}

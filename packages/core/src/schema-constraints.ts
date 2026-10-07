import type { $ZodType } from 'zod/v4/core';

/** Read check definitions without depending on Zod's no-longer-populated constraint bag. */
export function readSchemaConstraints(schema: $ZodType): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const patterns = new Set<RegExp>();
  const def = schema._zod.def as unknown as Record<string, unknown>;
  const checks = (def['checks'] ?? []) as Array<{ _zod: { def: Record<string, unknown> } }>;
  for (const check of [def, ...checks.map((check) => check._zod.def)]) {
    const kind = check['check'];
    for (const key of ['minimum', 'maximum']) {
      const value = check[key];
      if (typeof value === 'number') {
        const previous = result[key];
        result[key] =
          typeof previous === 'number'
            ? key === 'minimum'
              ? Math.max(previous, value)
              : Math.min(previous, value)
            : value;
      }
    }
    if (kind === 'length_equals' || kind === 'size_equals') {
      result['minimum'] = result['maximum'] = check['length'] ?? check['size'];
    }
    if (kind === 'greater_than' || kind === 'less_than') {
      const key = kind === 'greater_than' ? 'Minimum' : 'Maximum';
      const property = check['inclusive'] ? key.toLowerCase() : `exclusive${key}`;
      const value = check['value'];
      const previous = result[property];
      result[property] =
        typeof previous === 'number' && typeof value === 'number'
          ? kind === 'greater_than'
            ? Math.max(previous, value)
            : Math.min(previous, value)
          : value;
    }
    if (typeof check['format'] === 'string' && check['format'] !== 'regex')
      result['format'] = check['format'];
    if (check['pattern'] instanceof RegExp) patterns.add(check['pattern']);
  }
  if (patterns.size) result['patterns'] = patterns;
  return result;
}

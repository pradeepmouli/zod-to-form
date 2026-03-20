import type { $ZodType as ZodType } from 'zod/v4/core';

export function getDef(schema: ZodType): Record<string, unknown> {
  const candidate = schema as unknown as {
    def?: Record<string, unknown>;
    _zod?: { def?: Record<string, unknown> };
  };

  return candidate['def'] ?? candidate['_zod']?.['def'] ?? {};
}

export function getShape(def: Record<string, unknown>): Record<string, ZodType> {
  const rawShape = def['shape'];

  if (typeof rawShape === 'function') {
    const computed = rawShape as () => unknown;
    return (computed() as Record<string, ZodType>) ?? {};
  }

  return (rawShape as Record<string, ZodType>) ?? {};
}

export function getBag(schema: ZodType): Record<string, unknown> {
  const candidate = schema as unknown as {
    def?: { bag?: Record<string, unknown> };
    _zod?: { bag?: Record<string, unknown> };
  };

  return candidate['_zod']?.['bag'] ?? candidate['def']?.['bag'] ?? {};
}

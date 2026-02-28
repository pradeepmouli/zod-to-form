import type { ZodType } from 'zod';

export function getDef(schema: ZodType): Record<string, unknown> {
  return (schema as unknown as { _zod?: { def?: Record<string, unknown> } })['_zod']?.['def'] ?? {};
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
  return (schema as unknown as { _zod?: { bag?: Record<string, unknown> } })['_zod']?.['bag'] ?? {};
}

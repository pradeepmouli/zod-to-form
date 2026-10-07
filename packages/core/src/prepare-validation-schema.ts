import { compile } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import type { OptimizationConfig } from './config.js';

const compiledSchemas = new WeakMap<$ZodType, $ZodType>();

/** Compile final validation targets once; preserve authored schemas for metadata lookup. */
export function prepareValidationSchema<T extends $ZodType>(
  schema: T,
  optimization?: OptimizationConfig
): T {
  if (!optimization?.compileZod) return schema;
  const cached = compiledSchemas.get(schema);
  if (cached) return cached as T;
  const prepared = compile(schema);
  compiledSchemas.set(schema, prepared);
  return prepared;
}

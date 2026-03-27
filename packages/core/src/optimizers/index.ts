export type {
  FormOptimizer,
  FormOptimizerContext,
  WalkResult,
  SchemaLiteCollector,
  SchemaLiteEntry
} from './types.js';

export { createSchemaLiteCollector } from './schema-lite.js';

import type { FormOptimizer } from './types.js';

/**
 * Create an optimizer registry by merging custom optimizers with builtins.
 * Custom optimizers for a type replace the entire chain for that type.
 */
export function createOptimizers(
  custom: Record<string, FormOptimizer[]> = {}
): Record<string, FormOptimizer[]> {
  return { ...builtinOptimizers, ...custom };
}

/**
 * Built-in optimizers, populated by L1/L2/L3 registration.
 * Keyed by def.type, each entry is an ordered chain of optimizers.
 */
export const builtinOptimizers: Record<string, FormOptimizer[]> = {};

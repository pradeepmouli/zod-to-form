export type {
  FormOptimizer,
  FormOptimizerContext,
  WalkResult,
  SchemaLiteCollector,
  SchemaLiteInfo
} from './types.js';

export { createSchemaLiteCollector } from './schema-lite.js';

import type { FormOptimizer } from './types.js';
import { buildL1Optimizers } from './l1-decompose.js';
import { buildL2Optimizers } from './l2-native-rules.js';

/**
 * Built-in optimizers, populated by L1/L2 registration.
 * Keyed by def.type, each entry is an ordered chain of optimizers (L1 → L2).
 */
function buildBuiltinOptimizers(): Record<string, FormOptimizer[]> {
  const l1 = buildL1Optimizers();
  const l2 = buildL2Optimizers();

  const combined: Record<string, FormOptimizer[]> = { ...l1 };

  // Append L2 optimizers after L1 for types that have both
  for (const [type, optimizers] of Object.entries(l2)) {
    if (combined[type]) {
      combined[type] = [...combined[type], ...optimizers];
    } else {
      combined[type] = optimizers;
    }
  }

  return combined;
}

export const builtinOptimizers: Record<string, FormOptimizer[]> = buildBuiltinOptimizers();

/**
 * Create an optimizer registry by merging custom optimizers with builtins.
 * Custom optimizers for a type replace the entire chain for that type.
 */
export function createOptimizers(
  custom: Record<string, FormOptimizer[]> = {}
): Record<string, FormOptimizer[]> {
  return { ...builtinOptimizers, ...custom };
}

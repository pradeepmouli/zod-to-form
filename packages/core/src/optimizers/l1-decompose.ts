import type { $ZodType } from 'zod/v4/core';
import type { FormOptimizer } from './types.js';

/**
 * Level 1 optimizer: Stores the original Zod schema on each field
 * and sets validation.mode = 'zodSchema' for per-field validation.
 *
 * This is the foundational optimizer that decomposes the full-form
 * zodResolver into per-field validators.
 */
const l1Optimizer: FormOptimizer = (schema: $ZodType, _ctx, field) => {
  field.zodSchema = schema;
  field.validation = { mode: 'zodSchema' };
};

/**
 * All Zod def.types that L1 handles. Each gets the same base optimizer
 * that stores the schema and sets zodSchema mode.
 */
const L1_TYPES = [
  // Leaf types
  'string',
  'number',
  'bigint',
  'boolean',
  'date',
  'enum',
  'literal',
  'file',
  'template_literal',
  // Container types
  'object',
  'array',
  'tuple',
  'union',
  'intersection',
  'record',
  'map',
  'set',
  // Wrapper types (delegate to inner, but the schema reference is the wrapper)
  'optional',
  'nullable',
  'default',
  'prefault',
  'readonly',
  'pipe',
  'lazy',
  // Fallback types — still get zodSchema mode for safety
  'transform',
  'custom',
  'any',
  'unknown',
  'nan',
  'void',
  'never',
  'null',
  'undefined',
  'symbol',
  'function',
  'promise',
  'catch',
  'success',
  'nonoptional'
] as const;

/**
 * Build the L1 optimizer registry: every type gets the same optimizer.
 */
export function buildL1Optimizers(): Record<string, FormOptimizer[]> {
  const registry: Record<string, FormOptimizer[]> = {};
  for (const type of L1_TYPES) {
    registry[type] = [l1Optimizer];
  }
  return registry;
}

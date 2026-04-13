import type { $ZodType } from 'zod/v4/core';
import type { FormOptimizer } from './types.js';
import { extractNativeRules } from './constraint-map.js';

/** Types where the component enforces the constraint (no validation needed) */
const COMPONENT_ENFORCED_TYPES = new Set(['enum', 'boolean', 'literal']);

/**
 * Wrapper types that delegate to an inner schema via def.innerType.
 * L2 must unwrap these to find the constraint-bearing inner schema —
 * a wrapped z.string().min(2).optional() has its constraints on the
 * inner string, not on the outer optional's bag.
 */
const WRAPPER_TYPES = new Set(['optional', 'nullable', 'default', 'prefault', 'readonly']);

/**
 * Walk inward through wrapper types to find the constraint-bearing schema.
 * Returns the schema itself if it isn't a wrapper.
 */
function unwrapToInner(schema: $ZodType): $ZodType {
  let current = schema;
  while (true) {
    const def = current._zod.def as unknown as Record<string, unknown>;
    const type = def['type'] as string;
    if (!WRAPPER_TYPES.has(type)) return current;
    const innerType = def['innerType'] as $ZodType | undefined;
    if (!innerType) return current;
    current = innerType;
  }
}

/**
 * Level 2 optimizer: Converts simple Zod constraints to native RHF rules.
 *
 * For fields without refine/transform, replaces zodSchema with native
 * RHF register rules (minLength, maxLength, min, max, pattern, required).
 *
 * For enum/boolean/literal fields, sets component-enforced mode
 * (no validation emitted since the component guarantees valid values).
 *
 * Fields with refine/transform stay as 'zodSchema' mode (strict equivalence).
 */
const l2Optimizer: FormOptimizer = (schema: $ZodType, ctx, field) => {
  // Safety net: L2 optimizers are only appended to the chain when level >= 2
  // (see buildBuiltinOptimizers), so this guard can't trigger under normal
  // operation. Kept as a defensive check for custom optimizer registrations.
  if (ctx.level < 2) return;

  // Skip if L1 didn't set zodSchema mode
  if (field.validation?.mode !== 'zodSchema') return;

  // Component-enforced types need no validation
  if (COMPONENT_ENFORCED_TYPES.has(field.zodType)) {
    field.validation = { mode: 'component-enforced' };
    field.zodSchema = undefined;
    return;
  }

  // Unwrap wrapper types (optional/nullable/default/prefault/readonly) to find
  // the constraint-bearing inner schema. Constraints on z.string().min(2).optional()
  // live in the inner string's bag, not the outer optional's bag.
  const innerSchema = unwrapToInner(schema);

  // Try to extract native rules from the unwrapped schema
  const nativeRules = extractNativeRules(innerSchema);

  if (nativeRules !== null) {
    // All constraints mapped to native rules — switch to native mode
    // Add required flag based on optionality
    if (field.required) {
      nativeRules.required = nativeRules.required ?? 'This field is required';
    }

    field.validation = { mode: 'native', rules: nativeRules };
    field.zodSchema = undefined;
  }
  // If nativeRules is null, field stays as 'zodSchema' (has refine/transform)
};

/**
 * Zod types that L2 handles for native rule extraction.
 *
 * Wrapper types (optional/nullable/default/prefault/readonly) are included so
 * that e.g. z.string().min(2).optional() still gets native rule extraction —
 * the L2 optimizer unwraps them to find the constraint-bearing inner schema.
 */
const L2_TYPES = [
  // Constraint-bearing leaf types
  'string',
  'number',
  'bigint',
  'date',
  'file',
  'template_literal',
  // Component-enforced
  'enum',
  'boolean',
  'literal',
  // Wrapper types — unwrapped before extraction
  'optional',
  'nullable',
  'default',
  'prefault',
  'readonly'
] as const;

/**
 * Build the L2 optimizer registry.
 */
export function buildL2Optimizers(): Record<string, FormOptimizer[]> {
  const registry: Record<string, FormOptimizer[]> = {};
  for (const type of L2_TYPES) {
    registry[type] = [l2Optimizer];
  }
  return registry;
}

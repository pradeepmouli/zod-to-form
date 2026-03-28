import type { $ZodType } from 'zod/v4/core';
import type { NativeRules } from '../types.js';

/**
 * Extract native RHF rules from a Zod schema's constraint bag.
 *
 * Uses _zod.bag exclusively (Constitution Principle I) — the same substrate
 * API as the existing processors (string.ts, number.ts).
 *
 * Returns NativeRules if all constraints can be mapped to native rules,
 * or null if the schema has effects (refine/transform) that prevent
 * native conversion (strict equivalence — FR-017).
 */
export function extractNativeRules(schema: $ZodType): NativeRules | null {
  const bag = schema._zod.bag as Record<string, unknown>;
  const def = schema._zod.def as unknown as Record<string, unknown>;
  const checks = def['checks'] as Array<{ _zod?: { def: Record<string, unknown> } }> | undefined;

  // If any check is a refine/transform/custom, the entire chain stays as atomic Zod
  if (checks) {
    for (const check of checks) {
      const checkDef = check._zod?.def ?? (check as Record<string, unknown>);
      const checkType = checkDef['check'] as string | undefined;
      if (checkType === 'custom' || checkType === 'transform') {
        return null;
      }
    }
  }

  const rules: NativeRules = {};

  // String constraints: minimum → minLength, maximum → maxLength
  const minimum = bag['minimum'];
  if (typeof minimum === 'number') {
    rules.minLength = {
      value: minimum,
      message: extractMessage(checks, 'min_length', `Minimum ${minimum} characters`)
    };
  }

  const maximum = bag['maximum'];
  if (typeof maximum === 'number') {
    rules.maxLength = {
      value: maximum,
      message: extractMessage(checks, 'max_length', `Maximum ${maximum} characters`)
    };
  }

  // Number constraints: bag also uses 'minimum'/'maximum' for number min/max.
  // Detect number vs string by checking if the schema type is numeric.
  const schemaType = (def['type'] as string) ?? '';
  if (schemaType === 'number' || schemaType === 'bigint') {
    // For numbers, bag['minimum'] and bag['maximum'] are the bounds.
    // Check inclusivity from the check defs — RHF min/max are always inclusive.
    if (typeof minimum === 'number') {
      if (!isInclusive(checks, 'greater_than')) return null; // exclusive → can't map
      rules.min = {
        value: minimum,
        message: extractMessage(checks, 'greater_than', `Must be at least ${minimum}`)
      };
      delete rules.minLength; // was string interpretation, replace with number
    }
    if (typeof maximum === 'number') {
      if (!isInclusive(checks, 'less_than')) return null;
      rules.max = {
        value: maximum,
        message: extractMessage(checks, 'less_than', `Must be at most ${maximum}`)
      };
      delete rules.maxLength;
    }
  }

  // Format-based patterns (email, url, uuid) — extract exact Zod regex from bag
  const patternsSet = bag['patterns'];
  if (patternsSet instanceof Set && patternsSet.size > 0) {
    const firstPattern = [...patternsSet][0] as RegExp | undefined;
    if (firstPattern instanceof RegExp) {
      rules.pattern = {
        value: firstPattern,
        message: extractMessage(checks, 'string_format', 'Invalid format')
      };
    }
  }

  return rules;
}

/**
 * Check if a numeric bound check is inclusive.
 * RHF min/max rules are always inclusive (>=, <=), so exclusive bounds
 * must fall back to atomic Zod for strict equivalence.
 */
function isInclusive(
  checks: Array<{ _zod?: { def: Record<string, unknown> } }> | undefined,
  checkName: string
): boolean {
  if (!checks) return true; // No checks = assume inclusive (default for z.number().min/max)
  for (const check of checks) {
    const checkDef = check._zod?.def ?? (check as Record<string, unknown>);
    if (checkDef['check'] === checkName) {
      // Zod v4 defaults to inclusive=true for min/max
      return checkDef['inclusive'] !== false;
    }
  }
  return true;
}

/**
 * Extract the error message for a specific check type from the checks array.
 * Falls back to the provided default message.
 */
function extractMessage(
  checks: Array<{ _zod?: { def: Record<string, unknown> } }> | undefined,
  checkName: string,
  fallback: string
): string {
  if (!checks) return fallback;
  for (const check of checks) {
    const checkDef = check._zod?.def ?? (check as Record<string, unknown>);
    if (checkDef['check'] === checkName) {
      const error = checkDef['error'];
      if (typeof error === 'function') {
        try {
          const result = (error as () => unknown)();
          if (typeof result === 'string') return result;
          if (result && typeof result === 'object' && 'message' in result) {
            const msg = (result as { message: unknown }).message;
            if (typeof msg === 'string') return msg;
          }
        } catch {
          // Fall through to fallback
        }
      }
      if (typeof error === 'string') return error;
    }
  }
  return fallback;
}

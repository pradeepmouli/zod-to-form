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
      if (checkType === 'custom' || checkType === 'transform' || checkType === undefined) {
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

  // Number constraints: Zod v4 uses bag['minimum'] for inclusive (min/gte)
  // and bag['exclusiveMinimum'] for exclusive (gt). RHF min/max are always
  // inclusive, so exclusive bounds cannot be mapped — fall back to atomic Zod.
  const schemaType = (def['type'] as string) ?? '';
  if (schemaType === 'number' || schemaType === 'bigint') {
    const exclusiveMin = bag['exclusiveMinimum'];
    const exclusiveMax = bag['exclusiveMaximum'];

    // Exclusive bounds → can't map to native RHF rules
    if (typeof exclusiveMin === 'number' || typeof exclusiveMax === 'number') {
      return null;
    }

    if (typeof minimum === 'number') {
      rules.min = {
        value: minimum,
        message: extractMessage(checks, 'greater_than', `Must be at least ${minimum}`)
      };
      delete rules.minLength; // was string interpretation, replace with number
    }
    if (typeof maximum === 'number') {
      rules.max = {
        value: maximum,
        message: extractMessage(checks, 'less_than', `Must be at most ${maximum}`)
      };
      delete rules.maxLength;
    }
  }

  // Format-based patterns (email, url, uuid) — extract exact Zod regex from bag.
  // Multiple patterns (e.g. z.string().email().url()) can't be represented as a
  // single RHF pattern rule — fall back to atomic Zod for strict equivalence.
  const patternsSet = bag['patterns'];
  if (patternsSet instanceof Set && patternsSet.size > 1) {
    return null;
  }
  if (patternsSet instanceof Set && patternsSet.size === 1) {
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

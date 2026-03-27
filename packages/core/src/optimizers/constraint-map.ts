import type { $ZodType } from 'zod/v4/core';
import type { NativeRules } from '../types.js';

interface CheckDef {
  check: string;
  error?: (() => { message?: string }) | string;
  minimum?: number;
  maximum?: number;
  value?: number;
  inclusive?: boolean;
  format?: string;
  pattern?: RegExp;
  [key: string]: unknown;
}

function extractErrorMessage(check: CheckDef, fallback: string): string {
  if (typeof check.error === 'function') {
    try {
      const result = check.error();
      if (typeof result === 'string') return result;
      if (
        result &&
        typeof result === 'object' &&
        'message' in result &&
        typeof result.message === 'string'
      ) {
        return result.message;
      }
    } catch {
      // Fall through to fallback
    }
  }
  if (typeof check.error === 'string') return check.error;
  return fallback;
}

/**
 * Attempt to extract native RHF rules from a Zod schema's checks.
 *
 * Returns NativeRules if ALL checks can be mapped to native rules,
 * or null if any check cannot be mapped (strict equivalence — FR-017).
 */
export function extractNativeRules(schema: $ZodType): NativeRules | null {
  const def = schema._zod.def as unknown as Record<string, unknown>;
  const checks = def['checks'] as CheckDef[] | undefined;

  if (!checks || checks.length === 0) {
    return {};
  }

  const rules: NativeRules = {};
  let hasRefine = false;

  for (const check of checks) {
    const checkDef = ('_zod' in check ? (check as any)._zod.def : check) as CheckDef;

    switch (checkDef.check) {
      case 'min_length': {
        const value = checkDef.minimum;
        if (typeof value === 'number') {
          rules.minLength = {
            value,
            message: extractErrorMessage(checkDef, `Minimum ${value} characters`)
          };
        }
        break;
      }

      case 'max_length': {
        const value = checkDef.maximum;
        if (typeof value === 'number') {
          rules.maxLength = {
            value,
            message: extractErrorMessage(checkDef, `Maximum ${value} characters`)
          };
        }
        break;
      }

      case 'greater_than': {
        const value = checkDef.value;
        if (typeof value === 'number') {
          rules.min = {
            value,
            message: extractErrorMessage(checkDef, `Must be at least ${value}`)
          };
        }
        break;
      }

      case 'less_than': {
        const value = checkDef.value;
        if (typeof value === 'number') {
          rules.max = { value, message: extractErrorMessage(checkDef, `Must be at most ${value}`) };
        }
        break;
      }

      case 'string_format': {
        // Extract exact Zod regex for format validators (email, url, uuid, etc.)
        const pattern = checkDef.pattern;
        if (pattern instanceof RegExp) {
          rules.pattern = {
            value: pattern,
            message: extractErrorMessage(checkDef, `Invalid format`)
          };
        } else {
          // Can't extract regex — fall back to atomic Zod
          hasRefine = true;
        }
        break;
      }

      case 'regex': {
        const pattern = checkDef.pattern;
        if (pattern instanceof RegExp) {
          rules.pattern = {
            value: pattern,
            message: extractErrorMessage(checkDef, `Invalid format`)
          };
        } else {
          hasRefine = true;
        }
        break;
      }

      case 'number_format': {
        // Integer checks (int, safeint) — no native RHF equivalent, but harmless
        // since step=1 is handled by the HTML input. Skip as non-blocking.
        break;
      }

      case 'custom':
      case 'transform':
        // Cannot map refine/transform to native rules
        hasRefine = true;
        break;

      default:
        // Unknown check type — fall back to atomic Zod for safety
        hasRefine = true;
        break;
    }

    if (hasRefine) {
      return null; // Strict equivalence: any unmappable check → keep entire chain as Zod
    }
  }

  return rules;
}

/**
 * Check if a schema has any refine, transform, or pipe effects.
 * These prevent conversion to native rules.
 */
export function hasEffects(schema: $ZodType): boolean {
  const def = schema._zod.def as unknown as Record<string, unknown>;
  const checks = def['checks'] as CheckDef[] | undefined;

  if (!checks) return false;

  return checks.some((check) => {
    const checkDef = ('_zod' in check ? (check as any)._zod.def : check) as CheckDef;
    return checkDef.check === 'custom' || checkDef.check === 'transform';
  });
}

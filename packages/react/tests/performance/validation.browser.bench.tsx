import { bench, describe } from 'vitest';
import { walkSchema } from '@zod-to-form/core';
import type { FormField, WalkResult } from '@zod-to-form/core';
import type { $ZodType } from 'zod/v4/core';
import {
  smallSchema,
  mediumSchema,
  largeSchema,
  smallValidData,
  mediumValidData,
  largeValidData
} from './schemas.js';

// ─── Pre-compute walk results for each optimization level ───────────

function safeParse(schema: $ZodType | unknown, data: unknown) {
  return (schema as { safeParse(d: unknown): unknown }).safeParse(data);
}

interface WalkResultsByLevel {
  none: FormField[];
  l1: WalkResult;
  l2: WalkResult;
}

function walkAllLevels(schema: unknown): WalkResultsByLevel {
  return {
    none: walkSchema(schema as never) as FormField[],
    l1: walkSchema(schema as never, { optimization: { level: 1 } }) as WalkResult,
    l2: walkSchema(schema as never, { optimization: { level: 2 } }) as WalkResult
  };
}

const smallWalk = walkAllLevels(smallSchema);
const mediumWalk = walkAllLevels(mediumSchema);
const largeWalk = walkAllLevels(largeSchema);

// ─── Helpers to simulate validation at each level ───────────────────

/**
 * No optimization: full Zod schema.safeParse (what zodResolver does)
 */
function validateFull(schema: unknown, data: unknown): void {
  safeParse(schema, data);
}

/**
 * L1: per-field zodSchema.safeParse for each leaf field
 */
function validateL1(fields: FormField[], data: Record<string, unknown>): void {
  for (const field of fields) {
    if (field.zodSchema) {
      const value = data[field.key];
      safeParse(field.zodSchema, value);
    }
    if (field.children) {
      const nested = (data[field.key.split('.')[0]!] ?? {}) as Record<string, unknown>;
      validateL1(field.children, nested);
    }
  }
}

/**
 * L2: native rules are just object lookups (simulates RHF register validation).
 * For fields that fell back to zodSchema mode, still runs safeParse.
 */
function validateL2(fields: FormField[], data: Record<string, unknown>): void {
  for (const field of fields) {
    if (field.validation?.mode === 'native') {
      const rules = field.validation.rules;
      const value = data[field.key];
      if (rules?.required && !value) {
        /* would set error */
      }
      if (rules?.minLength && typeof value === 'string') {
        value.length >= rules.minLength.value;
      }
      if (rules?.maxLength && typeof value === 'string') {
        value.length <= rules.maxLength.value;
      }
      if (rules?.min && typeof value === 'number') {
        value >= rules.min.value;
      }
      if (rules?.max && typeof value === 'number') {
        value <= rules.max.value;
      }
      if (rules?.pattern && typeof value === 'string') {
        rules.pattern.value.test(value);
      }
    } else if (field.validation?.mode === 'zodSchema' && field.zodSchema) {
      const value = data[field.key];
      safeParse(field.zodSchema, value);
    }
    // component-enforced: no validation needed
    if (field.children) {
      const nested = (data[field.key.split('.')[0]!] ?? {}) as Record<string, unknown>;
      validateL2(field.children, nested);
    }
  }
}

// ─── Validation benchmarks ──────────────────────────────────────────

const scenarios = [
  {
    name: 'small (5 fields)',
    schema: smallSchema,
    data: smallValidData,
    walk: smallWalk
  },
  {
    name: 'medium (18 fields)',
    schema: mediumSchema,
    data: mediumValidData,
    walk: mediumWalk
  },
  {
    name: 'large (50 fields)',
    schema: largeSchema,
    data: largeValidData,
    walk: largeWalk
  }
] as const;

describe('browser validation', () => {
  for (const { name, schema, data, walk } of scenarios) {
    describe(name, () => {
      bench('no optimization (full schema.safeParse)', () => {
        validateFull(schema, data);
      });

      bench('L1 (per-field zodSchema.safeParse)', () => {
        validateL1(walk.l1.fields, data as Record<string, unknown>);
      });

      bench('L2 (native rules + zodSchema fallback)', () => {
        validateL2(walk.l2.fields, data as Record<string, unknown>);
      });
    });
  }
});

// schemaLite validation (only for schemas with cross-field effects)
describe('browser schemaLite validation', () => {
  if (largeWalk.l1.schemaLite) {
    bench('large schema - schemaLite.safeParse (L1)', () => {
      safeParse(largeWalk.l1.schemaLite!, largeValidData);
    });
  }
  if (largeWalk.l2.schemaLite) {
    bench('large schema - schemaLite.safeParse (L2)', () => {
      safeParse(largeWalk.l2.schemaLite!, largeValidData);
    });
  }
});

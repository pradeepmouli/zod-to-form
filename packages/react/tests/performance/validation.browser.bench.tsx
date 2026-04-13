import { bench, describe } from 'vitest';
import { walkSchema } from '@zod-to-form/core';
import type { FormField, NativeRules, WalkResult } from '@zod-to-form/core';
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

// ─── Helpers ────────────────────────────────────────────────────────

function flattenLeafFields(fields: FormField[]): FormField[] {
  const leaves: FormField[] = [];
  for (const field of fields) {
    if (field.children && field.children.length > 0) {
      leaves.push(...flattenLeafFields(field.children));
    } else {
      leaves.push(field);
    }
  }
  return leaves;
}

function getValueAtPath(data: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = data;
  for (const seg of segments) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return current;
}

/** Run L2 native rule checks against one value — simulates RHF's native validation. */
function applyNativeRules(rules: NativeRules | undefined, value: unknown): void {
  if (!rules) return;
  if (rules.required && !value) {
    /* error */
  }
  if (rules.minLength && typeof value === 'string') {
    value.length >= rules.minLength.value;
  }
  if (rules.maxLength && typeof value === 'string') {
    value.length <= rules.maxLength.value;
  }
  if (rules.min && typeof value === 'number') {
    value >= rules.min.value;
  }
  if (rules.max && typeof value === 'number') {
    value <= rules.max.value;
  }
  if (rules.pattern && typeof value === 'string') {
    rules.pattern.value.test(value);
  }
}

/** Submit-time: for L1/L2, RHF validates every leaf field, then schemaLite runs for cross-field effects. */
function submitL1(
  leaves: FormField[],
  data: Record<string, unknown>,
  schemaLite: $ZodType | null
): void {
  for (const field of leaves) {
    if (field.zodSchema) {
      safeParse(field.zodSchema, getValueAtPath(data, field.key));
    }
  }
  if (schemaLite) safeParse(schemaLite, data);
}

function submitL2(
  leaves: FormField[],
  data: Record<string, unknown>,
  schemaLite: $ZodType | null
): void {
  for (const field of leaves) {
    if (field.validation?.mode === 'native') {
      applyNativeRules(field.validation.rules, getValueAtPath(data, field.key));
    } else if (field.validation?.mode === 'zodSchema' && field.zodSchema) {
      safeParse(field.zodSchema, getValueAtPath(data, field.key));
    }
  }
  if (schemaLite) safeParse(schemaLite, data);
}

// ─── Benchmark scenarios ────────────────────────────────────────────

interface Scenario {
  name: string;
  schema: unknown;
  data: Record<string, unknown>;
  walk: WalkResultsByLevel;
  l1Leaves: FormField[];
  l2Leaves: FormField[];
  /** A single leaf field for per-keystroke simulation */
  keystrokeField: { l1: FormField; l2: FormField };
}

function buildScenario(
  name: string,
  schema: unknown,
  data: Record<string, unknown>,
  walk: WalkResultsByLevel
): Scenario {
  const l1Leaves = flattenLeafFields(walk.l1.fields);
  const l2Leaves = flattenLeafFields(walk.l2.fields);
  // Pick the first leaf with a zodSchema (L1) and a native rules field (L2)
  const l1Field = l1Leaves.find((f) => f.zodSchema !== undefined) ?? l1Leaves[0]!;
  const l2Field = l2Leaves.find((f) => f.validation?.mode === 'native') ?? l2Leaves[0]!;
  return {
    name,
    schema,
    data,
    walk,
    l1Leaves,
    l2Leaves,
    keystrokeField: { l1: l1Field, l2: l2Field }
  };
}

const scenarios: Scenario[] = [
  buildScenario(
    'small (5 fields)',
    smallSchema,
    smallValidData as Record<string, unknown>,
    smallWalk
  ),
  buildScenario(
    'medium (18 fields)',
    mediumSchema,
    mediumValidData as Record<string, unknown>,
    mediumWalk
  ),
  buildScenario(
    'large (50 fields)',
    largeSchema,
    largeValidData as Record<string, unknown>,
    largeWalk
  )
];

// ─── Keystroke benchmarks (single-field validation per op) ──────────
//
// Simulates RHF onChange mode: user types one character, one field re-validates.
// - no-opt (with zodResolver): RHF runs the full schema on every keystroke
// - L1: RHF runs the changed field's zodSchema only
// - L2: RHF runs the changed field's native rules only (nearly free)

describe('browser keystroke validation (1 field per op)', () => {
  for (const s of scenarios) {
    describe(s.name, () => {
      bench('no optimization (zodResolver → full schema)', () => {
        safeParse(s.schema, s.data);
      });

      bench('L1 (single-field zodSchema.safeParse)', () => {
        safeParse(s.keystrokeField.l1.zodSchema!, getValueAtPath(s.data, s.keystrokeField.l1.key));
      });

      bench('L2 (single-field native rule check)', () => {
        const field = s.keystrokeField.l2;
        const value = getValueAtPath(s.data, field.key);
        if (field.validation?.mode === 'native') {
          applyNativeRules(field.validation.rules, value);
        } else if (field.zodSchema) {
          safeParse(field.zodSchema, value);
        }
      });
    });
  }
});

// ─── Submit benchmarks (full form validation) ───────────────────────
//
// Simulates form submit: all fields validate, cross-field effects run.
// - no-opt: one full schema.safeParse (zodResolver)
// - L1: N field.zodSchema.safeParse + schemaLite.safeParse
// - L2: N native rule checks (nearly free) + schemaLite.safeParse

describe('browser submit validation (full form per op)', () => {
  for (const s of scenarios) {
    describe(s.name, () => {
      bench('no optimization (full schema.safeParse)', () => {
        safeParse(s.schema, s.data);
      });

      bench('L1 (N field parses + schemaLite)', () => {
        submitL1(s.l1Leaves, s.data, s.walk.l1.schemaLite);
      });

      bench('L2 (N native checks + schemaLite)', () => {
        submitL2(s.l2Leaves, s.data, s.walk.l2.schemaLite);
      });
    });
  }
});

// ─── schemaLite cost in isolation (cross-field effects only) ────────

describe('browser schemaLite (cross-field effects only)', () => {
  for (const s of scenarios) {
    describe(s.name, () => {
      if (s.walk.l1.schemaLite) {
        bench('L1 schemaLite.safeParse', () => {
          safeParse(s.walk.l1.schemaLite!, s.data);
        });
      }
      if (s.walk.l2.schemaLite) {
        bench('L2 schemaLite.safeParse', () => {
          safeParse(s.walk.l2.schemaLite!, s.data);
        });
      }
    });
  }
});

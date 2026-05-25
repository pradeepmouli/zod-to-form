/**
 * TDD tests for codegen emitting RHF register coercion options
 * via setValueAs for number/bigint/date/file fields.
 *
 * These tests verify the fix for:
 *   P1 — empty optional number input → NaN (not undefined) with valueAsNumber: true
 *   P2 — bigint precision loss above Number.MAX_SAFE_INTEGER via Number()
 *
 * The canonical setValueAs semantics (see register-hints.ts) must match
 * @zod-to-form/react exactly so generated forms and the runtime renderer
 * behave identically.
 *
 * See: packages/codegen/src/templates.ts buildCoercionOptionParts
 */
import { describe, it, expect } from 'vitest';
import type { FormField } from '@zod-to-form/core';
import { walkSchema } from '@zod-to-form/core';
import * as z from 'zod';
import { generateFormComponent, renderField } from '../src/index.ts';

function makeField(overrides: Partial<FormField> & { key: string }): FormField {
  return {
    component: 'Input',
    props: {},
    label: overrides.key,
    required: false,
    readOnly: false,
    hidden: false,
    disabled: false,
    deprecated: false,
    constraints: {},
    zodType: 'string',
    ...overrides
  };
}

const baseConfig = {
  exportName: 'CoercionSchema',
  componentName: 'CoercionForm',
  mode: 'submit' as const,
  ui: 'html' as const
};

// ─── walkSchema integration: z.object with number + date + string ──────────

describe('generateFormComponent — register coercion options via walkSchema', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().optional(),
    joined: z.date().optional()
  });

  it('emits setValueAs with empty→undefined guard for age (z.number().optional()) — P1 guard', () => {
    const fields = walkSchema(schema);
    const code = generateFormComponent(fields, baseConfig);
    // Must emit setValueAs (not valueAsNumber: true) for the age field
    expect(code).toContain("register('age', { setValueAs:");
    // Must guard against empty string → undefined (P1 fix)
    expect(code).toContain("v === ''");
    expect(code).toContain('Number(v)');
    // Must NOT emit the old valueAsNumber flag
    expect(code).not.toContain('valueAsNumber: true');
  });

  it('emits setValueAs with empty→undefined guard for joined (z.date().optional())', () => {
    const fields = walkSchema(schema);
    const code = generateFormComponent(fields, baseConfig);
    // Must emit setValueAs for the joined field (not valueAsDate: true)
    expect(code).toContain("register('joined', { setValueAs:");
    expect(code).toContain('new Date(');
    // Must NOT emit the old valueAsDate flag
    expect(code).not.toContain('valueAsDate: true');
  });

  it('emits bare register for name (z.string()) field — no coercion option', () => {
    const fields = walkSchema(schema);
    const code = generateFormComponent(fields, baseConfig);
    // name is a string field — must NOT have coercion options
    expect(code).toContain("register('name')");
    // and must NOT appear as register('name', { ...})
    expect(code).not.toContain("register('name', {");
  });
});

// ─── renderField unit tests ─────────────────────────────────────────────────

describe('renderField — coercion options per zodType', () => {
  it('emits setValueAs with Number() for a number Input field', () => {
    const field = makeField({ key: 'age', zodType: 'number' });
    const result = renderField(field);
    expect(result).toContain("register('age', { setValueAs:");
    expect(result).toContain('Number(v)');
    // P1 guard must be present: empty → undefined
    expect(result).toContain("v === ''");
  });

  it('emits setValueAs with new Date() for a date Input field (non-DatePicker component)', () => {
    const field = makeField({ key: 'joined', zodType: 'date' });
    const result = renderField(field);
    expect(result).toContain("register('joined', { setValueAs:");
    expect(result).toContain('new Date(');
    // P1 guard must be present: empty → undefined
    expect(result).toContain("v === ''");
  });

  it('emits setValueAs with BigInt() for a bigint field — P2 guard (no precision loss)', () => {
    const field = makeField({ key: 'bigNum', zodType: 'bigint' });
    const result = renderField(field);
    // Must use BigInt (not Number) to avoid precision loss above MAX_SAFE_INTEGER
    expect(result).toContain("register('bigNum', { setValueAs:");
    expect(result).toContain('BigInt(');
    // Must NOT use Number() for bigint — that would lose precision
    expect(result).not.toContain('Number(v)');
  });

  it('does NOT emit coercion for a string field', () => {
    const field = makeField({ key: 'name', zodType: 'string' });
    const result = renderField(field);
    // bare register — no options object
    expect(result).toContain("register('name')");
    expect(result).not.toContain("register('name', {");
  });

  it('DatePicker component still emits setValueAs with new Date()', () => {
    const field = makeField({ key: 'dob', zodType: 'date', component: 'DatePicker' });
    const result = renderField(field);
    expect(result).toContain('setValueAs:');
    expect(result).toContain('new Date(');
    // Must NOT use the old valueAsDate: true flag
    expect(result).not.toContain('valueAsDate: true');
  });

  it('emits setValueAs arrow function for a file Input field', () => {
    const field = makeField({ key: 'avatar', zodType: 'file', component: 'FileInput' });
    const result = renderField(field);
    // Must have a setValueAs coercion function in the register call
    expect(result).toContain('setValueAs');
    expect(result).toContain("register('avatar', {");
  });
});

// ─── P1 regression guard: empty optional number → undefined ─────────────────

describe('generateFormComponent — P1 guard: z.number().optional() generates empty→undefined', () => {
  it('generated register includes empty→undefined guard for z.number().optional()', () => {
    const fields = [
      makeField({
        key: 'score',
        zodType: 'number',
        required: false // optional
      })
    ];
    const code = generateFormComponent(fields, baseConfig);
    // The generated setValueAs must guard empty string → undefined (not NaN)
    expect(code).toContain("v === ''");
    expect(code).toContain('undefined');
    expect(code).toContain('Number(v)');
    // Must NOT emit valueAsNumber: true which would give NaN on empty input
    expect(code).not.toContain('valueAsNumber: true');
  });
});

// ─── optimized path: renderOptimizedRegister also emits coercion ────────────

describe('generateFormComponent optimized — coercion + validation combined', () => {
  it('emits setValueAs alongside native rules for an optimized number field', () => {
    const fields = [
      makeField({
        key: 'age',
        zodType: 'number',
        validation: {
          mode: 'native',
          rules: {
            min: { value: 0, message: 'Must be >= 0' },
            max: { value: 120, message: 'Must be <= 120' }
          }
        }
      })
    ];
    const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 2 });
    // setValueAs coercion option (not valueAsNumber)
    expect(code).toContain('setValueAs:');
    expect(code).toContain('Number(v)');
    // P1 guard must be present
    expect(code).toContain("v === ''");
    // native rules still present
    expect(code).toContain('min: { value: 0');
    expect(code).toContain('max: { value: 120');
    // Must NOT emit the old valueAsNumber flag
    expect(code).not.toContain('valueAsNumber: true');
  });

  it('emits setValueAs alongside native rules for an optimized date field', () => {
    const fields = [
      makeField({
        key: 'startDate',
        zodType: 'date',
        component: 'DatePicker',
        validation: {
          mode: 'native',
          rules: { required: 'Required' }
        }
      })
    ];
    const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 2 });
    expect(code).toContain('setValueAs:');
    expect(code).toContain('new Date(');
    expect(code).toContain('required: "Required"');
    // Must NOT emit the old valueAsDate flag
    expect(code).not.toContain('valueAsDate: true');
  });

  it('emits setValueAs alongside zodSchema validate for an optimized number field', () => {
    const fields = [
      makeField({
        key: 'score',
        zodType: 'number',
        validation: { mode: 'zodSchema' },
        zodSchema: {} as never
      })
    ];
    const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 1 });
    expect(code).toContain('setValueAs:');
    expect(code).toContain('validate');
    // Must NOT emit the old valueAsNumber flag
    expect(code).not.toContain('valueAsNumber: true');
  });

  it('emits bare register (no coercion) for component-enforced string field in optimized mode', () => {
    const fields = [
      makeField({
        key: 'role',
        zodType: 'string',
        component: 'Select',
        validation: { mode: 'component-enforced' }
      })
    ];
    const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 2 });
    expect(code).toContain("register('role')");
    expect(code).not.toContain("register('role', {");
  });
});

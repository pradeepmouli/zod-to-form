/**
 * TDD tests for codegen emitting RHF register coercion options
 * (valueAsNumber, valueAsDate, setValueAs) for number/date/file fields.
 *
 * These tests were written BEFORE the implementation to drive the fix.
 * See: packages/codegen/src/templates.ts renderField / renderOptimizedRegister
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

  it('emits valueAsNumber: true for age (z.number()) field', () => {
    const fields = walkSchema(schema);
    const code = generateFormComponent(fields, baseConfig);
    // Must contain register with valueAsNumber for the age field
    expect(code).toContain("register('age', { valueAsNumber: true })");
  });

  it('emits valueAsDate: true for joined (z.date()) field', () => {
    const fields = walkSchema(schema);
    const code = generateFormComponent(fields, baseConfig);
    // Must contain register with valueAsDate for the joined field
    expect(code).toContain("register('joined', { valueAsDate: true })");
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
  it('emits valueAsNumber for a number Input field', () => {
    const field = makeField({ key: 'age', zodType: 'number' });
    const result = renderField(field);
    expect(result).toContain("register('age', { valueAsNumber: true })");
  });

  it('emits valueAsDate for a date Input field (non-DatePicker component)', () => {
    const field = makeField({ key: 'joined', zodType: 'date' });
    const result = renderField(field);
    expect(result).toContain("register('joined', { valueAsDate: true })");
  });

  it('does NOT emit coercion for a string field', () => {
    const field = makeField({ key: 'name', zodType: 'string' });
    const result = renderField(field);
    // bare register — no options object
    expect(result).toContain("register('name')");
    expect(result).not.toContain("register('name', {");
  });

  it('DatePicker component still emits valueAsDate: true', () => {
    const field = makeField({ key: 'dob', zodType: 'date', component: 'DatePicker' });
    const result = renderField(field);
    expect(result).toContain('valueAsDate: true');
  });

  it('emits setValueAs arrow function for a file Input field', () => {
    const field = makeField({ key: 'avatar', zodType: 'file', component: 'FileInput' });
    const result = renderField(field);
    // Must have a setValueAs coercion function in the register call
    expect(result).toContain('setValueAs');
    expect(result).toContain("register('avatar', {");
  });
});

// ─── optimized path: renderOptimizedRegister also emits coercion ────────────

describe('generateFormComponent optimized — coercion + validation combined', () => {
  it('emits valueAsNumber alongside native rules for an optimized number field', () => {
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
    // coercion option
    expect(code).toContain('valueAsNumber: true');
    // native rules still present
    expect(code).toContain('min: { value: 0');
    expect(code).toContain('max: { value: 120');
  });

  it('emits valueAsDate alongside native rules for an optimized date field', () => {
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
    expect(code).toContain('valueAsDate: true');
    expect(code).toContain('required: "Required"');
  });

  it('emits valueAsNumber alongside zodSchema validate for an optimized number field', () => {
    const fields = [
      makeField({
        key: 'score',
        zodType: 'number',
        validation: { mode: 'zodSchema' },
        zodSchema: {} as never
      })
    ];
    const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 1 });
    expect(code).toContain('valueAsNumber: true');
    expect(code).toContain('validate');
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

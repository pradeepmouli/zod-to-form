import { describe, it, expect } from 'vitest';
import { resolveOptionsProps } from '../src/resolve-options-props.js';
import type { FormField, FormFieldOption } from '../src/types.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<FormField>): FormField {
  return {
    key: 'test',
    component: 'Select',
    props: {},
    label: 'Test',
    required: false,
    readOnly: false,
    hidden: false,
    disabled: false,
    deprecated: false,
    constraints: {},
    zodType: 'enum',
    ...overrides
  };
}

const SAMPLE_OPTIONS: FormFieldOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true }
];

// ─── resolveOptionsProps ──────────────────────────────────────────────────────

describe('resolveOptionsProps', () => {
  it('returns { options } when field.options is present', () => {
    const result = resolveOptionsProps(makeField({ options: SAMPLE_OPTIONS }));
    expect(result).toEqual({ options: SAMPLE_OPTIONS });
  });

  it('returns the exact same options array reference', () => {
    const result = resolveOptionsProps(makeField({ options: SAMPLE_OPTIONS }));
    expect(result['options']).toBe(SAMPLE_OPTIONS);
  });

  it('returns {} when field.options is undefined', () => {
    const result = resolveOptionsProps(makeField({ options: undefined }));
    expect(result).toEqual({});
  });

  it('returns {} for a non-enum field without options', () => {
    const result = resolveOptionsProps(makeField({ zodType: 'string', options: undefined }));
    expect(result).toEqual({});
  });

  it('returns { options: [] } for an empty options array', () => {
    const result = resolveOptionsProps(makeField({ options: [] }));
    expect(result).toEqual({ options: [] });
  });
});

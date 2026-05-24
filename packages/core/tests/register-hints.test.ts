import { describe, it, expect } from 'vitest';
import { getFieldRegisterHints } from '../src/register-hints.js';
import type { FormField } from '../src/types.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<FormField>): FormField {
  return {
    key: 'test',
    component: 'Input',
    props: {},
    label: 'Test',
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

// ─── zodType coercions ────────────────────────────────────────────────────────

describe('getFieldRegisterHints — zodType coercions', () => {
  it('returns valueAsNumber:true for number fields', () => {
    const hints = getFieldRegisterHints(makeField({ zodType: 'number' }));
    expect(hints).toEqual({ valueAsNumber: true });
  });

  it('returns valueAsNumber:true for bigint fields', () => {
    const hints = getFieldRegisterHints(makeField({ zodType: 'bigint' }));
    expect(hints).toEqual({ valueAsNumber: true });
  });

  it('returns valueAsDate:true for date fields', () => {
    const hints = getFieldRegisterHints(makeField({ zodType: 'date' }));
    expect(hints).toEqual({ valueAsDate: true });
  });

  it("returns setValueAs:'file' for file fields", () => {
    const hints = getFieldRegisterHints(makeField({ zodType: 'file' }));
    expect(hints).toEqual({ setValueAs: 'file' });
  });

  it('returns empty hints for plain string fields', () => {
    const hints = getFieldRegisterHints(makeField({ zodType: 'string' }));
    expect(hints).toEqual({});
  });

  it('returns empty hints for boolean fields', () => {
    const hints = getFieldRegisterHints(makeField({ zodType: 'boolean' }));
    expect(hints).toEqual({});
  });
});

// ─── validation modes ─────────────────────────────────────────────────────────

describe('getFieldRegisterHints — native validation mode (L2)', () => {
  it('returns nativeRules with required when rule is present', () => {
    const hints = getFieldRegisterHints(
      makeField({
        validation: {
          mode: 'native',
          rules: { required: 'This field is required' }
        }
      })
    );
    expect(hints).toEqual({ nativeRules: { required: 'This field is required' } });
  });

  it('returns nativeRules with min and max', () => {
    const hints = getFieldRegisterHints(
      makeField({
        zodType: 'number',
        validation: {
          mode: 'native',
          rules: {
            min: { value: 0, message: 'Must be at least 0' },
            max: { value: 100, message: 'Must be at most 100' }
          }
        }
      })
    );
    expect(hints).toEqual({
      valueAsNumber: true,
      nativeRules: {
        min: { value: 0, message: 'Must be at least 0' },
        max: { value: 100, message: 'Must be at most 100' }
      }
    });
  });

  it('returns nativeRules with minLength and maxLength', () => {
    const hints = getFieldRegisterHints(
      makeField({
        validation: {
          mode: 'native',
          rules: {
            minLength: { value: 2, message: 'Too short' },
            maxLength: { value: 50, message: 'Too long' }
          }
        }
      })
    );
    expect(hints).toEqual({
      nativeRules: {
        minLength: { value: 2, message: 'Too short' },
        maxLength: { value: 50, message: 'Too long' }
      }
    });
  });

  it('returns nativeRules with pattern', () => {
    const hints = getFieldRegisterHints(
      makeField({
        validation: {
          mode: 'native',
          rules: {
            pattern: { value: /^[a-z]+$/, message: 'Lowercase only' }
          }
        }
      })
    );
    expect(hints).toEqual({
      nativeRules: {
        pattern: { value: /^[a-z]+$/, message: 'Lowercase only' }
      }
    });
  });

  it('returns empty nativeRules object when rules is present but all falsy', () => {
    const hints = getFieldRegisterHints(
      makeField({
        validation: { mode: 'native', rules: {} }
      })
    );
    expect(hints).toEqual({ nativeRules: {} });
  });

  it('returns no hints when rules is undefined in native mode', () => {
    const hints = getFieldRegisterHints(
      makeField({
        validation: { mode: 'native' }
      })
    );
    expect(hints).toEqual({});
  });
});

describe('getFieldRegisterHints — zodSchema validation mode (L1)', () => {
  it('returns validate:true for zodSchema mode', () => {
    const hints = getFieldRegisterHints(
      makeField({
        validation: { mode: 'zodSchema' }
      })
    );
    expect(hints).toEqual({ validate: true });
  });

  it('does NOT set nativeRules when mode is zodSchema', () => {
    const hints = getFieldRegisterHints(
      makeField({
        validation: { mode: 'zodSchema' }
      })
    );
    expect(hints.nativeRules).toBeUndefined();
  });
});

describe('getFieldRegisterHints — component-enforced validation mode', () => {
  it('returns no validate hint for component-enforced mode', () => {
    const hints = getFieldRegisterHints(
      makeField({
        validation: { mode: 'component-enforced' }
      })
    );
    expect(hints.validate).toBeUndefined();
    expect(hints.nativeRules).toBeUndefined();
  });
});

describe('getFieldRegisterHints — no validation set', () => {
  it('returns empty hints when validation is undefined', () => {
    const hints = getFieldRegisterHints(makeField({ validation: undefined }));
    expect(hints).toEqual({});
  });
});

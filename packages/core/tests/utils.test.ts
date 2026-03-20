import { describe, expect, it } from 'vitest';
import {
  inferLabel,
  joinPath,
  regexToMask,
  getEmptyDefault,
  createBaseField
} from '../src/utils.js';
import type { FormField } from '../src/types.js';

describe('inferLabel', () => {
  it('converts camelCase to Title Case', () => {
    expect(inferLabel('firstName')).toBe('First Name');
  });

  it('converts snake_case to Title Case', () => {
    expect(inferLabel('email_address')).toBe('Email Address');
  });

  it('uses the last segment of a dotted path', () => {
    expect(inferLabel('address.street')).toBe('Street');
  });
});

describe('joinPath', () => {
  it('returns key when no parent', () => {
    expect(joinPath(undefined, 'name')).toBe('name');
  });

  it('joins parent and key with a dot', () => {
    expect(joinPath('address', 'street')).toBe('address.street');
  });
});

describe('regexToMask', () => {
  // ── Digit patterns ────────────────────────────────────────────────

  it('converts \\d{N} to N nines', () => {
    expect(regexToMask('^\\d{4}$')).toBe('9999');
  });

  it('converts bare \\d (no quantifier) to a single 9', () => {
    expect(regexToMask('^\\d$')).toBe('9');
  });

  it('converts SSN pattern \\d{3}-\\d{2}-\\d{4}', () => {
    expect(regexToMask('^\\d{3}-\\d{2}-\\d{4}$')).toBe('999-99-9999');
  });

  it('converts date pattern \\d{2}/\\d{2}/\\d{4}', () => {
    expect(regexToMask('^\\d{2}/\\d{2}/\\d{4}$')).toBe('99/99/9999');
  });

  it('converts credit card pattern \\d{4}-\\d{4}-\\d{4}-\\d{4}', () => {
    expect(regexToMask('^\\d{4}-\\d{4}-\\d{4}-\\d{4}$')).toBe('9999-9999-9999-9999');
  });

  it('converts phone pattern \\(\\d{3}\\) \\d{3}-\\d{4} with escaped literal parens', () => {
    expect(regexToMask('^\\(\\d{3}\\) \\d{3}-\\d{4}$')).toBe('(999) 999-9999');
  });

  it('converts [0-9] character class to 9', () => {
    expect(regexToMask('^[0-9]{4}$')).toBe('9999');
  });

  // ── Letter patterns ───────────────────────────────────────────────

  it('converts [A-Z]{N} to N letter placeholders', () => {
    expect(regexToMask('^[A-Z]{2}$')).toBe('aa');
  });

  it('converts [a-z]{N} to N letter placeholders', () => {
    expect(regexToMask('^[a-z]{3}$')).toBe('aaa');
  });

  it('converts [A-Za-z]{N} to N letter placeholders', () => {
    expect(regexToMask('^[A-Za-z]{4}$')).toBe('aaaa');
  });

  it('converts mixed alpha+digit pattern like post code [A-Z]{2}\\d{5}', () => {
    expect(regexToMask('^[A-Z]{2}\\d{5}$')).toBe('aa99999');
  });

  // ── Alphanumeric patterns ─────────────────────────────────────────

  it('converts [A-Za-z0-9]{N} to N * placeholders', () => {
    expect(regexToMask('^[A-Za-z0-9]{6}$')).toBe('******');
  });

  it('converts [a-zA-Z0-9]{N} to N * placeholders', () => {
    expect(regexToMask('^[a-zA-Z0-9]{8}$')).toBe('********');
  });

  // ── Separator chars ───────────────────────────────────────────────

  it('passes through separator characters (. : _ +)', () => {
    expect(regexToMask('^\\d{2}:\\d{2}:\\d{2}$')).toBe('99:99:99');
    expect(regexToMask('^\\d{4}_\\d{4}$')).toBe('9999_9999');
  });

  // ── Returns null for complex patterns ────────────────────────────

  it('returns null for email pattern (too complex)', () => {
    expect(regexToMask('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')).toBeNull();
  });

  it('returns null for patterns with variable-length quantifiers {N,M}', () => {
    expect(regexToMask('^\\d{2,4}$')).toBeNull();
  });

  it('returns null for patterns with + quantifier', () => {
    expect(regexToMask('^\\d+$')).toBeNull();
  });

  it('returns null for patterns with * quantifier', () => {
    expect(regexToMask('^\\d*$')).toBeNull();
  });

  it('returns null for alternation |', () => {
    expect(regexToMask('^\\d{4}|\\d{5}$')).toBeNull();
  });

  it('returns null for unknown character classes', () => {
    expect(regexToMask('^[^a-z]{4}$')).toBeNull();
  });

  it('returns null for empty result', () => {
    expect(regexToMask('^$')).toBeNull();
  });
});

describe('getEmptyDefault', () => {
  function field(overrides: Partial<FormField>): FormField {
    return { ...createBaseField('test', 'string'), ...overrides };
  }

  it('returns empty string for string fields', () => {
    expect(getEmptyDefault(field({ zodType: 'string' }))).toBe('');
  });

  it('returns 0 for number fields', () => {
    expect(getEmptyDefault(field({ zodType: 'number' }))).toBe(0);
  });

  it('returns 0 for bigint fields', () => {
    expect(getEmptyDefault(field({ zodType: 'bigint' }))).toBe(0);
  });

  it('returns false for boolean fields', () => {
    expect(getEmptyDefault(field({ zodType: 'boolean' }))).toBe(false);
  });

  it('returns undefined for date fields', () => {
    expect(getEmptyDefault(field({ zodType: 'date' }))).toBeUndefined();
  });

  it('returns first option value for enum fields', () => {
    expect(
      getEmptyDefault(
        field({
          options: [
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'User' }
          ]
        })
      )
    ).toBe('admin');
  });

  it('returns explicit defaultValue when present', () => {
    expect(getEmptyDefault(field({ defaultValue: 'hello' }))).toBe('hello');
  });

  it('returns empty array for ArrayField', () => {
    expect(getEmptyDefault(field({ component: 'ArrayField' }))).toEqual([]);
  });

  it('recursively builds object for Fieldset', () => {
    const result = getEmptyDefault(
      field({
        component: 'Fieldset',
        children: [
          { ...createBaseField('obj.name', 'string'), zodType: 'string' },
          { ...createBaseField('obj.age', 'number'), zodType: 'number' }
        ]
      })
    );
    expect(result).toEqual({ name: '', age: 0 });
  });
});

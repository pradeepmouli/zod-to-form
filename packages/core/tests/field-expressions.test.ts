import { describe, it, expect } from 'vitest';
import { RHF_FIELD_EXPRESSIONS } from '../src/config.js';

describe('RHF_FIELD_EXPRESSIONS', () => {
  it('recognizes the boolean coercion expression', () => {
    expect(RHF_FIELD_EXPRESSIONS.has('!!field.value')).toBe(true);
  });

  it('contains the standard field expressions', () => {
    expect(RHF_FIELD_EXPRESSIONS.has('field.value')).toBe(true);
    expect(RHF_FIELD_EXPRESSIONS.has('field.onChange')).toBe(true);
    expect(RHF_FIELD_EXPRESSIONS.has('field.onBlur')).toBe(true);
    expect(RHF_FIELD_EXPRESSIONS.has('field.ref')).toBe(true);
    expect(RHF_FIELD_EXPRESSIONS.has('field.name')).toBe(true);
  });
});

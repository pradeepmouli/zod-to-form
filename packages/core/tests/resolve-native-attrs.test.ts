import { describe, it, expect } from 'vitest';
import { resolveNativeAttrs, NATIVE_INPUT_ATTRS } from '../src/resolve-native-attrs.js';
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

// ─── resolveNativeAttrs ───────────────────────────────────────────────────────

describe('resolveNativeAttrs', () => {
  it('returns {} when props is empty', () => {
    const result = resolveNativeAttrs(makeField({ props: {} }));
    expect(result).toEqual({});
  });

  it('extracts type from field.props when present', () => {
    const result = resolveNativeAttrs(makeField({ props: { type: 'email' } }));
    expect(result).toEqual({ type: 'email' });
  });

  it("extracts type:'number' correctly", () => {
    const result = resolveNativeAttrs(makeField({ props: { type: 'number' } }));
    expect(result).toEqual({ type: 'number' });
  });

  it('ignores keys not in NATIVE_INPUT_ATTRS (e.g. _isSet, data-foo)', () => {
    const result = resolveNativeAttrs(
      makeField({ props: { _isSet: true, 'data-foo': 'bar', type: 'text' } })
    );
    // only type is in NATIVE_INPUT_ATTRS
    expect(result).toEqual({ type: 'text' });
    expect('_isSet' in result).toBe(false);
    expect('data-foo' in result).toBe(false);
  });

  it('skips type when its value is null', () => {
    const result = resolveNativeAttrs(makeField({ props: { type: null } }));
    expect(result).toEqual({});
  });

  it('skips type when its value is undefined', () => {
    const result = resolveNativeAttrs(makeField({ props: { type: undefined } }));
    expect(result).toEqual({});
  });

  it('returns {} when props contains only internal keys', () => {
    const result = resolveNativeAttrs(makeField({ props: { _isSet: true } }));
    expect(result).toEqual({});
  });
});

describe('NATIVE_INPUT_ATTRS', () => {
  it('contains "type"', () => {
    expect(NATIVE_INPUT_ATTRS).toContain('type');
  });
});

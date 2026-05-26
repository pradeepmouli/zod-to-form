import { describe, it, expect } from 'vitest';
import { resolveBaseProps } from '../src/resolve-base-props.js';
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

// ─── resolveBaseProps ─────────────────────────────────────────────────────────

describe('resolveBaseProps', () => {
  it('always includes id from field.key', () => {
    const result = resolveBaseProps(makeField({ key: 'username' }));
    expect(result['id']).toBe('username');
  });

  it('returns only id when no flags are set', () => {
    const result = resolveBaseProps(makeField({ key: 'name' }));
    expect(result).toEqual({ id: 'name' });
  });

  it('includes required:true when field.required is true', () => {
    const result = resolveBaseProps(makeField({ key: 'email', required: true }));
    expect(result).toEqual({ id: 'email', required: true });
  });

  it('includes readOnly:true when field.readOnly is true', () => {
    const result = resolveBaseProps(makeField({ key: 'email', readOnly: true }));
    expect(result).toEqual({ id: 'email', readOnly: true });
  });

  it('includes disabled:true when field.disabled is true', () => {
    const result = resolveBaseProps(makeField({ key: 'email', disabled: true }));
    expect(result).toEqual({ id: 'email', disabled: true });
  });

  it('includes all three flags when readOnly and disabled are both true', () => {
    const result = resolveBaseProps(makeField({ key: 'status', readOnly: true, disabled: true }));
    expect(result).toEqual({ id: 'status', readOnly: true, disabled: true });
  });

  it('includes all three flags when required, readOnly, and disabled are all true', () => {
    const result = resolveBaseProps(
      makeField({ key: 'name', required: true, readOnly: true, disabled: true })
    );
    expect(result).toEqual({ id: 'name', required: true, readOnly: true, disabled: true });
  });

  it('does not include aria-invalid (runtime concern, not static)', () => {
    const result = resolveBaseProps(makeField({ key: 'field' }));
    expect('aria-invalid' in result).toBe(false);
  });
});

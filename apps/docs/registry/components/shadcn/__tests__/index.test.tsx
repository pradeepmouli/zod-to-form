/**
 * TDD test for the shadcn adapters index aggregator (Task 7).
 */
import { describe, it, expect } from 'vitest';
import * as adapters from '../index.js';
import { components } from '../index.js';

describe('Field* layout primitive re-exports', () => {
  it('re-exports the Base UI Field* wrappers (so generated forms import them from the adapter module)', () => {
    for (const k of ['Field', 'FieldLabel', 'FieldDescription', 'FieldError', 'FieldGroup']) {
      expect(typeof (adapters as Record<string, unknown>)[k], `${k} should be exported`).toBe(
        'function'
      );
    }
  });

  it('does NOT add the Field* wrappers to the components field map', () => {
    for (const k of ['Field', 'FieldLabel', 'FieldDescription', 'FieldError', 'FieldGroup']) {
      expect(k in components, `${k} must not be a field component`).toBe(false);
    }
  });
});

describe('components map', () => {
  it('exposes all core field components', () => {
    for (const k of [
      'Input',
      'Textarea',
      'Checkbox',
      'Switch',
      'Select',
      'RadioGroup',
      'DatePicker'
    ]) {
      const component = components[k as keyof typeof components];
      // Plain function components have typeof === 'function'.
      // forwardRef components (Input, Textarea) return an object wrapper.
      // Both are valid React renderable components.
      const isReactComponent =
        typeof component === 'function' || (typeof component === 'object' && component !== null);
      expect(isReactComponent, `${k} should be a React component`).toBe(true);
    }
  });

  it('has exactly seven entries', () => {
    expect(Object.keys(components)).toHaveLength(7);
  });
});

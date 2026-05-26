/**
 * TDD test for the shadcn adapters index aggregator (Task 7).
 */
import { describe, it, expect } from 'vitest';
import { components } from '../index.js';

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

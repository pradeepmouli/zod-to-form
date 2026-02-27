import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { z } from 'zod';
import { useZodForm } from '../src/useZodForm.js';

describe('useZodForm', () => {
  it('returns { form, fields }', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().optional()
    });

    const { result } = renderHook(() => useZodForm(schema));

    expect(result.current.form).toBeDefined();
    expect(result.current.fields).toBeDefined();
    expect(Array.isArray(result.current.fields)).toBe(true);
  });

  it('memoizes walkSchema output by schema reference', () => {
    const schema = z.object({ name: z.string() });

    const { result, rerender } = renderHook(() => useZodForm(schema));
    const firstFieldsRef = result.current.fields;

    rerender();

    expect(result.current.fields).toBe(firstFieldsRef);
  });
});

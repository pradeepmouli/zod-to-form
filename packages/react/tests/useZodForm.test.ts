import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
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

  it('emits onValueChange for valid changes and suppresses invalid changes', async () => {
    const schema = z.object({
      name: z.string().min(2)
    });
    const onValueChange = vi.fn();

    const { result } = renderHook(() =>
      useZodForm(schema, {
        mode: 'onChange',
        onValueChange
      })
    );

    await act(async () => {
      result.current.form.setValue('name', 'a', {
        shouldDirty: true,
        shouldValidate: true
      });
    });

    await waitFor(() => {
      expect(onValueChange).not.toHaveBeenCalled();
    });

    await act(async () => {
      result.current.form.setValue('name', 'Ada', {
        shouldDirty: true,
        shouldValidate: true
      });
    });

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalled();
    });

    expect(onValueChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'Ada'
      })
    );
  });

  it('does not emit onValueChange on initial mount with default values', async () => {
    const schema = z.object({
      name: z.string().min(1)
    });
    const onValueChange = vi.fn();

    renderHook(() =>
      useZodForm(schema, {
        defaultValues: { name: 'Ada' },
        mode: 'onChange',
        onValueChange
      })
    );

    await waitFor(() => {
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });
});

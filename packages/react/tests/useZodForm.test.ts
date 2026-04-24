// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { z } from 'zod';
import type { FormMeta } from '@zod-to-form/core';
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

  it('emits onValueChange on every user edit — both invalid and valid states', async () => {
    // Previously this callback was gated on `schema.safeParse(...).success`,
    // which silently dropped every keystroke until the ENTIRE form parsed
    // cleanly. That made edits appear to "not stick" whenever any required
    // field was still empty. New contract: fire on every change, passing
    // coerced data on success and raw-but-normalized values otherwise.
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

    // Invalid (below min) — but we still surface the edit so consumers can
    // keep their mirror of the form in sync. The second arg signals validity
    // so consumers don't have to call safeParse themselves.
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'a' }), {
        isValid: false
      });
    });

    await act(async () => {
      result.current.form.setValue('name', 'Ada', {
        shouldDirty: true,
        shouldValidate: true
      });
    });

    await waitFor(() => {
      expect(onValueChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Ada' }), {
        isValid: true
      });
    });
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

  it('coerces empty strings to undefined so optional enums pass safeParse', async () => {
    const schema = z.object({
      mode: z.enum(['submit', 'auto-save']).optional(),
      label: z.string().optional()
    });
    const onValueChange = vi.fn();

    const { result } = renderHook(() =>
      useZodForm(schema, {
        defaultValues: { mode: 'submit', label: 'hello' },
        mode: 'onChange',
        onValueChange
      })
    );

    // Set the enum field to empty string (simulating HTML select clearing)
    await act(async () => {
      result.current.form.setValue('mode', '' as never, {
        shouldDirty: true,
        shouldValidate: true
      });
    });

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalled();
    });

    // Empty string should be coerced to undefined, not rejected.
    expect(onValueChange).toHaveBeenLastCalledWith(expect.objectContaining({ label: 'hello' }), {
      isValid: true
    });
    // mode should be undefined (coerced from "")
    const lastCall = onValueChange.mock.calls.at(-1)![0];
    expect(lastCall.mode).toBeUndefined();
  });

  describe('fields option', () => {
    it('applies flat field config overrides via fields option', () => {
      const schema = z.object({
        name: z.string(),
        bio: z.string()
      });

      const { result } = renderHook(() =>
        useZodForm(schema, {
          fields: {
            name: { component: 'Input', order: 0 },
            bio: { component: 'Textarea', order: 1 }
          }
        })
      );

      expect(result.current.fields).toHaveLength(2);
      expect(result.current.fields[0]?.key).toBe('name');
      expect(result.current.fields[0]?.component).toBe('Input');
      expect(result.current.fields[1]?.key).toBe('bio');
      expect(result.current.fields[1]?.component).toBe('Textarea');
    });

    it('formRegistry takes precedence over fields', () => {
      const name = z.string();
      const schema = z.object({ name });

      // Register as textarea via the registry
      const formRegistry = z.registry<FormMeta>();
      formRegistry.add(name, { component: 'Textarea' });

      const { result } = renderHook(() =>
        useZodForm(schema, {
          formRegistry,
          // fields would keep it as Input, but registry should win
          fields: {
            name: { component: 'Input' }
          }
        })
      );

      // If formRegistry wins, component is Textarea (not Input from fields)
      expect(result.current.fields[0]?.component).toBe('Textarea');
    });

    it('empty fields object does not create a registry', () => {
      const schema = z.object({ name: z.string() });

      const { result } = renderHook(() => useZodForm(schema, { fields: {} }));

      // Should still produce fields with default components
      expect(result.current.fields).toHaveLength(1);
      expect(result.current.fields[0]?.component).toBeDefined();
    });

    it('memoizes effectiveRegistry when fields reference is stable', () => {
      const schema = z.object({ name: z.string() });
      const fields = { name: { component: 'Input', order: 0 } };

      const { result, rerender } = renderHook(() => useZodForm(schema, { fields }));
      const firstFieldsRef = result.current.fields;

      rerender();

      expect(result.current.fields).toBe(firstFieldsRef);
    });
  });
});

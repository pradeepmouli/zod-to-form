// @vitest-environment jsdom
// SPDX-License-Identifier: MIT
// Tests for US2 — useExternalSync hook (010-editor-primitives).

import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useExternalSync } from '../src/useExternalSync.js';

interface Source {
  name: string;
}

interface Values {
  name: string;
}

const toValues = (s: Source | null): Values => ({ name: s?.name ?? '' });

function setup(initialSource: Source | null) {
  const formRef: { current: ReturnType<typeof useForm<Values>> | null } = { current: null };
  const result = renderHook(
    ({ source }: { source: Source | null }) => {
      const form = useForm<Values>({ defaultValues: toValues(source) });
      formRef.current = form;
      useExternalSync(form, source, toValues);
      return form;
    },
    { initialProps: { source: initialSource } }
  );
  return { ...result, formRef };
}

describe('useExternalSync', () => {
  // T016
  it('resets form values when source identity changes', () => {
    const A: Source = { name: 'Ada' };
    const B: Source = { name: 'Bea' };
    const { rerender, formRef } = setup(A);
    expect(formRef.current!.getValues('name')).toBe('Ada');
    rerender({ source: B });
    expect(formRef.current!.getValues('name')).toBe('Bea');
  });

  // T017
  it('preserves user edits when source reference is stable', () => {
    const A: Source = { name: 'Ada' };
    const { rerender, formRef } = setup(A);
    act(() => formRef.current!.setValue('name', 'Edited'));
    rerender({ source: A });
    expect(formRef.current!.getValues('name')).toBe('Edited');
  });

  // T018
  it('discards edits on identity change unless keepDirty: true', () => {
    const A: Source = { name: 'Ada' };
    const B: Source = { name: 'Bea' };

    // Default: discards
    const { rerender, formRef } = setup(A);
    act(() => formRef.current!.setValue('name', 'Edited', { shouldDirty: true }));
    rerender({ source: B });
    expect(formRef.current!.getValues('name')).toBe('Bea');

    // keepDirty: true
    const formRef2: { current: ReturnType<typeof useForm<Values>> | null } = { current: null };
    const r = renderHook(
      ({ source }: { source: Source }) => {
        const form = useForm<Values>({ defaultValues: toValues(source) });
        formRef2.current = form;
        useExternalSync(form, source, toValues, { keepDirty: true });
        return form;
      },
      { initialProps: { source: A } }
    );
    act(() => formRef2.current!.setValue('name', 'Edited', { shouldDirty: true }));
    r.rerender({ source: B });
    expect(formRef2.current!.getValues('name')).toBe('Edited');
  });

  // T019
  it('does not call form.reset on first render', () => {
    const A: Source = { name: 'Ada' };
    const resetSpy = vi.fn();
    renderHook(() => {
      const form = useForm<Values>({ defaultValues: toValues(A) });
      const original = form.reset;
      form.reset = (...args: Parameters<typeof original>) => {
        resetSpy(...args);
        return original(...args);
      };
      useExternalSync(form, A, toValues);
    });
    expect(resetSpy).not.toHaveBeenCalled();
  });

  // T020
  it('handles null source via toValues projection', () => {
    const { formRef } = setup(null);
    expect(formRef.current!.getValues('name')).toBe('');
  });
});

// SPDX-License-Identifier: MIT
// useExternalSync — reset a React Hook Form to a projection of an external
// source object whenever the source's reference identity changes.
//
// Reference-identity (Object.is) is the contract: stable reference means the
// hook does nothing, even if the source's contents mutate. This preserves
// user edits while a source object is being held, and snaps the form to a
// new source's projection only when the adopter swaps the reference.

import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

/**
 * Options for {@link useExternalSync}.
 *
 * @category Hooks
 */
export interface UseExternalSyncOptions {
  /**
   * If true, preserve dirty fields across an external reset.
   * Defaults to false (matches the common "I switched contexts; discard edits"
   * intent).
   */
  keepDirty?: boolean;
}

/**
 * Reset a form's values when an externally-supplied source object's reference
 * changes; preserve in-progress edits while the reference is stable.
 *
 * Adopters with mismatched source-vs-form shapes pass a `toValues` projection.
 *
 * @example
 * ```tsx
 * const { form } = useZodForm(schema, { defaultValues: toValues(node) });
 * useExternalSync(form, node, toValues);
 * ```
 *
 * @category Hooks
 */
export function useExternalSync<TSource, TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  source: TSource,
  toValues: (source: TSource) => TValues,
  options?: UseExternalSyncOptions
): void {
  const previousRef = useRef<{ source: TSource; initialised: true } | { initialised: false }>({
    initialised: false
  });
  const keepDirty = options?.keepDirty ?? false;

  // Side effects in an effect — never during render — so React 18 StrictMode's
  // double-invocation doesn't trigger spurious resets.
  useEffect(() => {
    const prev = previousRef.current;
    if (!prev.initialised) {
      previousRef.current = { source, initialised: true };
      return;
    }
    if (!Object.is(prev.source, source)) {
      form.reset(toValues(source), { keepDirtyValues: keepDirty });
      previousRef.current = { source, initialised: true };
    }
  }, [source, form, toValues, keepDirty]);
}

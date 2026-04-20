import type { $ZodType } from 'zod/v4/core';
import type { UseFormSetError, FieldPath, FieldValues } from 'react-hook-form';
import { normalizeFormValues } from '@zod-to-form/core';

type SafeParseable = {
  safeParse(data: unknown): {
    success: boolean;
    error?: { issues: Array<{ path: (string | number)[]; message: string }> };
  };
};

/**
 * Wraps a form `onSubmit` handler with `schemaLite` client-side validation.
 *
 * Runs `schemaLite.safeParse(normalizeFormValues(data))` before calling the
 * original handler. On failure, maps each validation issue to the corresponding
 * RHF field via `setError`. On success, delegates to `onSubmit` unchanged.
 *
 * Used by optimization-level codegen output to perform fast per-field
 * validation with a trimmed schema that omits cross-field refinements.
 *
 * @param schemaLite - The stripped Zod schema produced by `walkSchema` at optimization level 1+.
 * @param setError - RHF's `setError` function from `useFormContext`.
 * @param onSubmit - The original submit handler to call on successful validation.
 * @returns A wrapped submit handler with the same signature as `onSubmit`.
 *
 * @useWhen
 * - You are using a codegen output with `validationLevel: 1` or higher (schema-lite mode)
 * - You need to map server validation errors back to form fields via RHF's `setError`
 *
 * @avoidWhen
 * - You are using the default `zodResolver` path (no `validationLevel`) — validation
 *   is handled by RHF's resolver and this wrapper is redundant
 * - Your schema has cross-field refinements in the lite schema — the lite schema
 *   intentionally strips root-level refinements, so cross-field rules are NOT checked
 *
 * @never
 * - NEVER pass the full schema as `schemaLite` — it defeats the optimization and adds
 *   double-validation overhead; only pass the schema produced by `walkSchema`'s
 *   `result.schemaLite` field
 * - NEVER use this with schemas that have root-level `.superRefine()` — root refinements
 *   are stripped from `schemaLite` by design and will not run through this wrapper
 *
 * @remarks
 * The wrapper calls `normalizeFormValues()` on the data before passing it to `schemaLite.safeParse()`.
 * This ensures empty strings from HTML inputs are converted to `undefined`, matching Zod's `.optional()` expectation.
 * Each validation issue's `path` array is joined with `.` to produce the RHF field path for `setError`.
 *
 * @throws Never — validation errors are mapped to RHF's `setError` rather than thrown.
 *
 * @example
 * ```ts
 * const handleSubmit = wrapWithSchemaLite(schemaLite, setError, async (data) => {
 *   await fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) });
 * });
 * // Pass handleSubmit to RHF's form.handleSubmit(handleSubmit)
 * ```
 *
 * @category Optimization
 */
export function wrapWithSchemaLite<TData extends Record<string, unknown>>(
  schemaLite: $ZodType,
  setError: UseFormSetError<TData>,
  onSubmit: (data: TData) => void | Promise<void>
): (data: TData) => void | Promise<void> {
  const schema = schemaLite as unknown as SafeParseable;
  return (data: TData) => {
    const result = schema.safeParse(normalizeFormValues(data));
    if (!result.success && result.error) {
      for (const issue of result.error.issues) {
        const path = issue.path.map(String).join('.');
        if (path) {
          setError(path as FieldPath<TData>, { type: 'validate', message: issue.message });
        } else {
          setError('root', { type: 'validate', message: issue.message });
        }
      }
      return;
    }
    return onSubmit(data);
  };
}

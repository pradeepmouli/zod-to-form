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
 * Wraps a form onSubmit handler with schemaLite validation.
 * Runs schemaLite.safeParse on the form data before calling the original handler.
 * Maps validation errors to form fields via setError.
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

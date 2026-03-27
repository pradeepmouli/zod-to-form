import type { $ZodType } from 'zod/v4/core';
import type { UseFormSetError } from 'react-hook-form';

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
    const result = schema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error!.issues) {
        const path = issue.path.map(String).join('.');
        if (path) {
          // SAFETY: RHF's FieldPath type can't be derived from generic TData at runtime
          (setError as any)(path, { type: 'validate', message: issue.message });
        }
      }
      return;
    }
    return onSubmit(data);
  };
}

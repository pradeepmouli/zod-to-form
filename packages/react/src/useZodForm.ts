import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { walkSchema } from '@zodform/core';
import { useForm } from 'react-hook-form';
import type { ZodObject } from 'zod';
import type { FormMeta, FormProcessor } from '@zodform/core';

type UseZodFormOptions<TSchema extends ZodObject> = {
  defaultValues?: Partial<TSchema['_zod']['output']>;
  formRegistry?: {
    get(schema: TSchema): FormMeta | undefined;
    has(schema: TSchema): boolean;
  };
  processors?: Record<string, FormProcessor>;
};

export function useZodForm<TSchema extends ZodObject>(
  schema: TSchema,
  options?: UseZodFormOptions<TSchema>
) {
  const fields = useMemo(
    () =>
      walkSchema(schema, {
        formRegistry: options?.formRegistry,
        processors: options?.processors
      }),
    [schema, options?.formRegistry, options?.processors]
  );

  const form = useForm<TSchema['_zod']['output']>({
    resolver: zodResolver(schema) as any,
    defaultValues: options?.defaultValues as any
  });

  return {
    form,
    fields
  };
}

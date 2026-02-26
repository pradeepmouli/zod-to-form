import type { ReactNode } from 'react';
import { FormProvider } from 'react-hook-form';
import type { ZodObject } from 'zod';
import type { FormMeta, FormProcessor } from '@zodform/core';
import { FieldRenderer } from './FieldRenderer.js';
import { defaultComponentMap } from './components/index.js';
import { useZodForm } from './useZodForm.js';

type ZodFormProps<TSchema extends ZodObject> = {
  schema: TSchema;
  onSubmit: (data: TSchema['_zod']['output']) => unknown;
  defaultValues?: Partial<TSchema['_zod']['output']>;
  components?: Partial<typeof defaultComponentMap>;
  formRegistry?: {
    get(schema: TSchema): FormMeta | undefined;
    has(schema: TSchema): boolean;
  };
  processors?: Record<string, FormProcessor>;
  className?: string;
  children?: ReactNode;
};

export function ZodForm<TSchema extends ZodObject>(
  props: ZodFormProps<TSchema>
): ReactNode {
  const {
    schema,
    onSubmit,
    defaultValues,
    components,
    formRegistry,
    processors,
    className,
    children
  } = props;
  const mergedComponents = { ...defaultComponentMap, ...components };

  const { form, fields } = useZodForm(schema, {
    defaultValues,
    formRegistry,
    processors
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        {fields.map((field) => (
          <FieldRenderer key={field.key} field={field} components={mergedComponents} />
        ))}
        {children}
      </form>
    </FormProvider>
  );
}

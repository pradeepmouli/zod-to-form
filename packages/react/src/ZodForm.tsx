import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { FormProvider } from 'react-hook-form';
import type { ZodObject } from 'zod';
import type { FormProcessor, ZodFormRegistry } from '@zod-to-form/core';
import { FieldRenderer } from './FieldRenderer.js';
import { defaultComponentMap } from './components/index.js';
import type { RuntimeComponentConfig } from './FieldRenderer.js';
import { useZodForm } from './useZodForm.js';

type ZodFormProps<TSchema extends ZodObject> = {
  schema: TSchema;
  onSubmit?: (data: TSchema['_zod']['output']) => unknown;
  onValueChange?: (data: TSchema['_zod']['output']) => void;
  mode?: 'onSubmit' | 'onChange' | 'onBlur';
  defaultValues?: Partial<TSchema['_zod']['output']>;
  components?: Partial<typeof defaultComponentMap>;
  componentConfig?: RuntimeComponentConfig;
  formRegistry?: ZodFormRegistry;
  processors?: Record<string, FormProcessor>;
  className?: string;
  children?: ReactNode;
};

export function ZodForm<TSchema extends ZodObject>(props: ZodFormProps<TSchema>): ReactNode {
  const {
    schema,
    onSubmit,
    onValueChange,
    mode,
    defaultValues,
    components,
    componentConfig,
    formRegistry,
    processors,
    className,
    children
  } = props;
  const mergedComponents = useMemo(
    () => ({ ...defaultComponentMap, ...components }),
    [components]
  );

  const { form, fields } = useZodForm(schema, {
    defaultValues,
    formRegistry,
    processors,
    mode,
    onValueChange
  });

  const submitHandler = onSubmit ?? (() => undefined);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(submitHandler)} className={className} noValidate>
        {fields.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            components={mergedComponents}
            componentConfig={componentConfig}
          />
        ))}
        {children}
      </form>
    </FormProvider>
  );
}

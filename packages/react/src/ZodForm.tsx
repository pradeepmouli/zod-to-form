import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { FormProvider } from 'react-hook-form';
import type { output, ZodObject } from 'zod';
import type { FormField, FormProcessor, ZodFormRegistry } from '@zod-to-form/core';
import { normalizeFieldKey, collectFieldSections } from '@zod-to-form/core';
import { FieldRenderer } from './FieldRenderer.js';
import { defaultComponentMap } from './components/index.js';
import type { RuntimeComponentConfig } from './FieldRenderer.js';
import { useZodForm } from './useZodForm.js';

type ZodFormProps<TSchema extends ZodObject> = {
  schema: TSchema;
  onSubmit?: (data: output<TSchema>) => unknown;
  onValueChange?: (data: output<TSchema>) => void;
  mode?: 'onSubmit' | 'onChange' | 'onBlur';
  defaultValues?: Partial<output<TSchema>>;
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
  const mergedComponents = useMemo(() => ({ ...defaultComponentMap, ...components }), [components]);

  const { form, fields } = useZodForm(schema, {
    defaultValues,
    formRegistry,
    processors,
    mode,
    onValueChange
  });

  const submitHandler = onSubmit ?? (() => undefined);

  // Collect section groupings from config
  const sections = useMemo(() => {
    if (!componentConfig?.fields) return new Map<string, string[]>();
    const configFields = componentConfig.fields;
    return collectFieldSections(
      fields,
      (key) => configFields[key] ?? configFields[normalizeFieldKey(key)]
    );
  }, [fields, componentConfig]);

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
        {sections.size > 0 && (
          <SectionRenderer sections={sections} componentConfig={componentConfig} />
        )}
        {children}
      </form>
    </FormProvider>
  );
}

/**
 * Renders section components that group multiple form fields.
 * Each section component receives a `fields` prop with the field names it manages,
 * and reads/writes its fields via useFormContext (FormProvider).
 * Components must be pre-imported and provided via `componentConfig.sectionComponents`.
 */
function SectionRenderer({
  sections,
  componentConfig
}: {
  sections: Map<string, string[]>;
  componentConfig: RuntimeComponentConfig | undefined;
}) {
  const elements: ReactNode[] = [];
  for (const [sectionName, fieldKeys] of sections) {
    const SectionComponent = componentConfig?.sectionComponents?.[sectionName];
    if (SectionComponent) {
      elements.push(<SectionComponent key={sectionName} fields={fieldKeys} />);
    }
  }
  return <>{elements}</>;
}

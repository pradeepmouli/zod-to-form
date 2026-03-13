import type { ComponentType, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import type { output, ZodObject } from 'zod';
import type { FormField, FormProcessor, ZodFormRegistry } from '@zod-to-form/core';
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

    const result = new Map<string, string[]>();

    // Normalize field keys so that concrete indices like "items.0.x"
    // can match config keys like "items[].x".
    const normalizeFieldKey = (key: string): string => {
      // Replace any ".<number>(.|$)" with ".[]$1"
      return key.replace(/\.(\d+)(\.|$)/g, '.[]$2');
    };

    const getOverrideForKey = (key: string) => {
      const fieldsConfig = componentConfig.fields;
      if (!fieldsConfig) return undefined;

      const direct = fieldsConfig[key];
      if (direct) return direct;

      const normalizedKey = normalizeFieldKey(key);
      if (normalizedKey !== key) {
        return fieldsConfig[normalizedKey];
      }

      return undefined;
    };

    const traverseField = (field: FormField) => {
      const override = getOverrideForKey(field.key);
      if (override?.section) {
        const existing = result.get(override.section);
        if (existing) {
          existing.push(field.key);
        } else {
          result.set(override.section, [field.key]);
        }
      }

      if (Array.isArray((field as any).children)) {
        for (const child of (field as any).children as FormField[]) {
          traverseField(child);
        }
      }

      if ((field as any).arrayItem) {
        traverseField((field as any).arrayItem as FormField);
      }
    };

    for (const field of fields) {
      traverseField(field);
    }

    return result;
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
 */
function SectionRenderer({
  sections,
  componentConfig
}: {
  sections: Map<string, string[]>;
  componentConfig: RuntimeComponentConfig | undefined;
}) {
  const [resolvedComponents, setResolvedComponents] = useState<
    Map<string, ComponentType<{ fields: string[] }>>
  >(new Map());
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (!componentConfig || sections.size === 0) return;

    let cancelled = false;
    // Reset any previous error when re-running the effect
    setLoadError(null);

    (async () => {
      try {
        // Validate the module specifier to prevent loading from arbitrary paths
        const specifier = componentConfig.components;
        if (
          !specifier ||
          specifier.startsWith('/') ||
          specifier.split('/').some((part) => part === '..')
        ) {
          throw new Error(`Invalid module specifier for section components: "${specifier}"`);
        }

        const mod = (await import(/* @vite-ignore */ specifier)) as Record<string, unknown>;
        if (cancelled) return;

        const resolved = new Map<string, ComponentType<{ fields: string[] }>>();
        for (const sectionName of sections.keys()) {
          const component = mod[sectionName];
          // Accept plain functions AND React.memo / React.forwardRef wrapped components
          // (which are objects with a $$typeof symbol, not plain functions)
          const isValidComponent =
            typeof component === 'function' ||
            (typeof component === 'object' &&
              component !== null &&
              '$$typeof' in (component as object));
          if (isValidComponent) {
            resolved.set(sectionName, component as ComponentType<{ fields: string[] }>);
          }
        }
        setResolvedComponents(resolved);
      } catch (error) {
        if (cancelled) return;
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        setLoadError(normalizedError);
        // Clear any previously resolved components on error
        setResolvedComponents(new Map());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sections, componentConfig]);

  if (loadError) {
    // Surface dynamic import errors deterministically (e.g. to an Error Boundary)
    throw loadError;
  }

  const elements: ReactNode[] = [];
  for (const [sectionName, fieldKeys] of sections) {
    const SectionComponent = resolvedComponents.get(sectionName);
    if (SectionComponent) {
      elements.push(<SectionComponent key={sectionName} fields={fieldKeys} />);
    }
  }

  return <>{elements}</>;
}

import type { ComponentType, ReactNode } from 'react';
import { useMemo } from 'react';
import { FormProvider } from 'react-hook-form';
import type { output, ZodObject } from 'zod';
import type { FormField, FormProcessor, ZodFormRegistry } from '@zod-to-form/core';
import { normalizeFieldKey, collectFieldSections } from '@zod-to-form/core';
import { FieldRenderer, warnRemovedConfigKeys } from './FieldRenderer.js';
import { defaultComponentMap } from './components/index.js';
import type { RuntimeComponentConfig } from './FieldRenderer.js';
import { useZodForm } from './useZodForm.js';

type ZodFormProps<TSchema extends ZodObject> = {
  schema: TSchema;
  onSubmit?: (data: output<TSchema>) => unknown;
  onInvalid?: (errors: Record<string, unknown>) => void;
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
    onInvalid,
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
  // US6: Warn if the old sectionComponents key is detected in componentConfig
  if (
    componentConfig &&
    'sectionComponents' in componentConfig &&
    !_warnedKeys.has('sectionComponents')
  ) {
    _warnedKeys.add('sectionComponents');
    console.warn(
      `[zod-to-form] "sectionComponents" in componentConfig has been removed. ` +
        `Section components are now resolved from "componentConfig.componentModule" instead.`
    );
  }

  // One-time validation of removed config keys (propMap, gridColumn, controlled+expressions)
  warnRemovedConfigKeys(componentConfig);

  const mergedComponents = useMemo(() => ({ ...defaultComponentMap, ...components }), [components]);

  const { form, fields } = useZodForm(schema, {
    defaultValues,
    formRegistry,
    fields: componentConfig?.fields,
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

  // Fields assigned to a section are rendered by SectionRenderer instead
  const sectionFieldKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const fieldKeys of sections.values()) {
      for (const key of fieldKeys) keys.add(key);
    }
    return keys;
  }, [sections]);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(submitHandler, onInvalid)} className={className} noValidate>
        {fields
          .filter((field) => !sectionFieldKeys.has(field.key))
          .map((field) => (
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
 * Section components are resolved by name from `componentConfig.componentModule`.
 */
const _warnedKeys = new Set<string>();

function SectionRenderer({
  sections,
  componentConfig
}: {
  sections: Map<string, string[]>;
  componentConfig: RuntimeComponentConfig | undefined;
}) {
  const elements: ReactNode[] = [];
  const mod = componentConfig?.componentModule;

  if (!mod && sections.size > 0 && !_warnedKeys.has('__no_module__')) {
    _warnedKeys.add('__no_module__');
    console.warn(
      `[zod-to-form] ${sections.size} section(s) configured but componentModule is not provided. ` +
        `Section fields will not be rendered. Pass componentConfig.componentModule.`
    );
  }

  for (const [sectionName, fieldKeys] of sections) {
    const candidate = mod?.[sectionName];
    // Accept functions and React.memo/forwardRef/lazy (objects with $$typeof)
    if (
      typeof candidate === 'function' ||
      (candidate != null && typeof candidate === 'object' && '$$typeof' in candidate)
    ) {
      const SectionComponent = candidate as ComponentType<{ fields: string[] }>;
      elements.push(<SectionComponent key={sectionName} fields={fieldKeys} />);
    } else if (!_warnedKeys.has(sectionName)) {
      _warnedKeys.add(sectionName);
      const reason =
        candidate === undefined
          ? 'was not found in componentModule'
          : `was found but is not a function (got ${typeof candidate})`;
      console.warn(
        `[zod-to-form] Section "${sectionName}" (grouping fields: ${fieldKeys.join(', ')}) ` +
          `${reason}. Those fields will not be rendered.`
      );
    }
  }
  return <>{elements}</>;
}

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { FormField } from '@zod-to-form/core';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { defaultComponentMap } from './components/index.js';

type ComponentMap = typeof defaultComponentMap;

export type RuntimeComponentEntry = {
  component: string;
  render?: () => Promise<unknown>;
};

export type RuntimeFieldOverride = {
  fieldType: string;
  props?: Record<string, unknown>;
};

export type RuntimeComponentConfig = {
  components: string;
  fieldTypes: Record<string, RuntimeComponentEntry>;
  fields?: Partial<Record<string, RuntimeFieldOverride>>;
};

const moduleCache = new Map<string, Promise<Record<string, unknown>>>();
const resolvedComponentCache = new Map<string, ComponentType<Record<string, unknown>>>();
const resolvingComponentCache = new Map<string, Promise<ComponentType<Record<string, unknown>>>>();

function getModule(path: string): Promise<Record<string, unknown>> {
  const cached = moduleCache.get(path);
  if (cached) {
    return cached;
  }

  const loader = import(/* @vite-ignore */ path).then((mod) => mod as Record<string, unknown>);
  moduleCache.set(path, loader);
  return loader;
}

function resolveFieldOverride(
  field: FormField,
  componentConfig: RuntimeComponentConfig | undefined
): { entry?: RuntimeComponentEntry; override?: RuntimeFieldOverride } {
  if (!componentConfig) {
    return {};
  }

  const override = componentConfig.fields?.[field.key];
  if (override) {
    return {
      entry: componentConfig.fieldTypes[override.fieldType],
      override
    };
  }

  return {
    entry: componentConfig.fieldTypes[field.component]
  };
}

function asComponentType(
  value: unknown,
  errorMessage: string
): ComponentType<Record<string, unknown>> {
  if (typeof value !== 'function') {
    throw new Error(errorMessage);
  }

  return value as ComponentType<Record<string, unknown>>;
}

async function resolveConfiguredComponent(
  field: FormField,
  componentConfig: RuntimeComponentConfig,
  entry: RuntimeComponentEntry
): Promise<ComponentType<Record<string, unknown>>> {
  const cacheKey = `${componentConfig.components}::${entry.component}`;
  const cached = resolvedComponentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const resolving = resolvingComponentCache.get(cacheKey);
  if (resolving) {
    return resolving;
  }

  const resolvePromise = (async () => {
    let resolved: ComponentType<Record<string, unknown>>;

    if (entry.render) {
      resolved = asComponentType(
        await entry.render(),
        `INVALID_COMPONENT_ENTRY: field "${field.key}" render override must resolve to a function.`
      );
    } else {
      let mod: Record<string, unknown>;
      try {
        mod = await getModule(componentConfig.components);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `INVALID_RUNTIME_COMPONENT: failed to import "${componentConfig.components}" for field "${field.key}" (${message}).`
        );
      }

      const candidate = mod[entry.component];
      resolved = asComponentType(
        candidate,
        `INVALID_RUNTIME_COMPONENT: component "${entry.component}" in "${componentConfig.components}" is not a function.`
      );
    }

    resolvedComponentCache.set(cacheKey, resolved);
    return resolved;
  })();

  resolvingComponentCache.set(cacheKey, resolvePromise);

  try {
    return await resolvePromise;
  } finally {
    resolvingComponentCache.delete(cacheKey);
  }
}

function getErrorAtPath(errors: unknown, path: string): string | undefined {
  const segments = path.split('.');
  let current = errors as Record<string, unknown> | undefined;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = current[segment] as Record<string, unknown> | undefined;
  }

  const message = current?.['message'];
  if (typeof message === 'string') {
    return message;
  }

  return undefined;
}

function getRegisterOptions(field: FormField): Record<string, unknown> {
  if (field.zodType === 'number' || field.zodType === 'bigint') {
    return { valueAsNumber: true };
  }

  if (field.zodType === 'date') {
    return { valueAsDate: true };
  }

  if (field.zodType === 'file') {
    return {
      setValueAs: (value: unknown) => {
        if (value instanceof FileList) {
          return value.length > 0 ? value.item(0) : undefined;
        }
        return value;
      }
    };
  }

  return {};
}

type FieldRendererProps = {
  field: FormField;
  components?: Partial<ComponentMap>;
  componentConfig?: RuntimeComponentConfig;
};

// ─── T088: Fieldset block for nested object fields ────────────────────

function FieldsetBlock({ field, components, componentConfig }: FieldRendererProps) {
  const componentMap = { ...defaultComponentMap, ...components };
  const FormFieldComponent = componentMap.FormField;

  const wrapperProps: Record<string, unknown> = {};
  if (field.gridColumn) {
    wrapperProps['style'] = { gridColumn: field.gridColumn };
  }

  return (
    <FormFieldComponent {...wrapperProps}>
      <fieldset>
        <legend>{field.label}</legend>
        {field.children?.map((child) => (
          <FieldRenderer
            key={child.key}
            field={child}
            components={componentMap}
            componentConfig={componentConfig}
          />
        ))}
      </fieldset>
    </FormFieldComponent>
  );
}

// ─── T089: Array block with useFieldArray ─────────────────────────────

function getDefaultAppendValue(arrayItem: FormField | undefined): unknown {
  if (!arrayItem) return '';
  if (arrayItem.component === 'Fieldset') return {};
  if (arrayItem.zodType === 'number' || arrayItem.zodType === 'bigint') return 0;
  return '';
}

function ArrayBlock({ field, components, componentConfig }: FieldRendererProps) {
  const componentMap = { ...defaultComponentMap, ...components };
  const { control } = useFormContext();
  const { fields: items, append, remove } = useFieldArray({ control, name: field.key });
  const minLength = field.constraints.minLength ?? 0;

  const wrapperProps: Record<string, unknown> = {};
  if (field.gridColumn) {
    wrapperProps['style'] = { gridColumn: field.gridColumn };
  }

  return (
    <fieldset {...wrapperProps}>
      <legend>{field.label}</legend>
      {items.map((item, index) => {
        if (!field.arrayItem) return null;
        const itemField: FormField = { ...field.arrayItem, key: `${field.key}.${index}` };
        return (
          <div key={item.id}>
            <FieldRenderer
              field={itemField}
              components={componentMap}
              componentConfig={componentConfig}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={items.length <= minLength}
            >
              Remove
            </button>
          </div>
        );
      })}
      <button type="button" onClick={() => append(getDefaultAppendValue(field.arrayItem))}>
        Add
      </button>
    </fieldset>
  );
}

// ─── T090: Discriminated union block with watch ───────────────────────

function DiscriminatedUnionBlock({ field, components, componentConfig }: FieldRendererProps) {
  const componentMap = { ...defaultComponentMap, ...components };
  const { register, watch } = useFormContext();
  const discriminator = field.props['_discriminator'] as string;
  const discKey = `${field.key}.${discriminator}`;
  const currentValue = watch(discKey) as string | undefined;
  const variants = field.props['_variants'] as Record<string, FormField[]> | undefined;
  const variantFields = currentValue ? (variants?.[currentValue] ?? []) : [];

  const FormFieldComponent = componentMap.FormField;
  const FormLabelComponent = componentMap.FormLabel;
  const wrapperProps: Record<string, unknown> = {};
  if (field.gridColumn) {
    wrapperProps['style'] = { gridColumn: field.gridColumn };
  }

  return (
    <FormFieldComponent {...wrapperProps}>
      <FormLabelComponent htmlFor={discKey}>{field.label}</FormLabelComponent>
      <select id={discKey} {...register(discKey)}>
        <option value="">Select…</option>
        {field.options?.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
      {variantFields.map((child) => (
        <FieldRenderer
          key={child.key}
          field={child}
          components={componentMap}
          componentConfig={componentConfig}
        />
      ))}
    </FormFieldComponent>
  );
}

export function FieldRenderer({ field, components, componentConfig }: FieldRendererProps) {
  // Always call hooks first (React hooks rule — no conditional hook calls)
  const { register, formState } = useFormContext();
  const componentMap = { ...defaultComponentMap, ...components };
  const mapping = useMemo(
    () => resolveFieldOverride(field, componentConfig),
    [field, componentConfig]
  );
  const [configuredComponent, setConfiguredComponent] = useState<ComponentType<
    Record<string, unknown>
  > | null>(null);
  const [resolveError, setResolveError] = useState<Error | null>(null);

  useEffect(() => {
    if (!componentConfig || !mapping.entry) {
      setConfiguredComponent(null);
      setResolveError(null);
      return;
    }

    let cancelled = false;
    resolveConfiguredComponent(field, componentConfig, mapping.entry)
      .then((component) => {
        if (!cancelled) {
          setConfiguredComponent(() => component);
          setResolveError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setConfiguredComponent(null);
          setResolveError(error instanceof Error ? error : new Error(String(error)));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [field, componentConfig, mapping.entry]);

  if (resolveError) {
    throw resolveError;
  }

  // T088: dispatch nested object fields to FieldsetBlock
  if (field.component === 'Fieldset') {
    return (
      <FieldsetBlock field={field} components={componentMap} componentConfig={componentConfig} />
    );
  }

  // T089: dispatch array fields to ArrayBlock
  if (field.component === 'ArrayField') {
    return <ArrayBlock field={field} components={componentMap} componentConfig={componentConfig} />;
  }

  // T090: dispatch discriminated union to DiscriminatedUnionBlock
  if (field.component === 'Select' && field.props['_discriminator']) {
    return (
      <DiscriminatedUnionBlock
        field={field}
        components={componentMap}
        componentConfig={componentConfig}
      />
    );
  }

  const Component = (configuredComponent ??
    componentMap[field.component as keyof ComponentMap] ??
    componentMap.Input) as ComponentType<Record<string, unknown>>;
  const FormFieldComponent = componentMap.FormField;
  const FormLabelComponent = componentMap.FormLabel;
  const FormDescriptionComponent = componentMap.FormDescription;
  const FormMessageComponent = componentMap.FormMessage;
  const errorMessage = getErrorAtPath(formState.errors, field.key);

  if (field.hidden) {
    return null;
  }

  const registration = register(field.key, getRegisterOptions(field));
  const componentProps: Record<string, unknown> = {
    id: field.key,
    'aria-invalid': errorMessage ? 'true' : 'false',
    required: field.required,
    readOnly: field.readOnly,
    ...field.props,
    ...(mapping.override?.props ?? {}),
    ...registration
  };

  if ('options' in field && field['options']) {
    componentProps['options'] = field['options'];
  }

  const wrapperProps: Record<string, unknown> = {};
  if (field.gridColumn) {
    wrapperProps['style'] = { gridColumn: field.gridColumn };
  }

  const fieldContent: ReactNode = field.render ? (
    (field.render(field, componentProps) as ReactNode)
  ) : (
    <Component {...componentProps} />
  );

  return (
    <FormFieldComponent {...wrapperProps}>
      <FormLabelComponent htmlFor={field.key}>{field.label}</FormLabelComponent>
      {fieldContent}
      {field.description ? (
        <FormDescriptionComponent>{field.description}</FormDescriptionComponent>
      ) : null}
      {errorMessage ? <FormMessageComponent>{errorMessage}</FormMessageComponent> : null}
    </FormFieldComponent>
  );
}

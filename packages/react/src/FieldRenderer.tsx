import type { ComponentType, ReactNode } from 'react';
import type { FormField } from '@zod-to-form/core';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { defaultComponentMap } from './components/index.js';

type ComponentMap = typeof defaultComponentMap;

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
};

// ─── T088: Fieldset block for nested object fields ────────────────────

function FieldsetBlock({ field, components }: FieldRendererProps) {
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
          <FieldRenderer key={child.key} field={child} components={componentMap} />
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

function ArrayBlock({ field, components }: FieldRendererProps) {
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
            <FieldRenderer field={itemField} components={componentMap} />
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

function DiscriminatedUnionBlock({ field, components }: FieldRendererProps) {
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
        <FieldRenderer key={child.key} field={child} components={componentMap} />
      ))}
    </FormFieldComponent>
  );
}

export function FieldRenderer({ field, components }: FieldRendererProps) {
  // Always call hooks first (React hooks rule — no conditional hook calls)
  const { register, formState } = useFormContext();
  const componentMap = { ...defaultComponentMap, ...components };

  // T088: dispatch nested object fields to FieldsetBlock
  if (field.component === 'Fieldset') {
    return <FieldsetBlock field={field} components={componentMap} />;
  }

  // T089: dispatch array fields to ArrayBlock
  if (field.component === 'ArrayField') {
    return <ArrayBlock field={field} components={componentMap} />;
  }

  // T090: dispatch discriminated union to DiscriminatedUnionBlock
  if (field.component === 'Select' && field.props['_discriminator']) {
    return <DiscriminatedUnionBlock field={field} components={componentMap} />;
  }

  const Component = (componentMap[field.component as keyof ComponentMap] ??
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

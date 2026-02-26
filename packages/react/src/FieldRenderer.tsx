import type { ComponentType } from 'react';
import type { FormField } from '@zodform/core';
import { useFormContext } from 'react-hook-form';
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

  return {};
}

type FieldRendererProps = {
  field: FormField;
  components?: Partial<ComponentMap>;
};

export function FieldRenderer({ field, components }: FieldRendererProps) {
  const { register, formState } = useFormContext();
  const componentMap = { ...defaultComponentMap, ...components };
  const Component =
    (componentMap[field.component as keyof ComponentMap] ?? componentMap.Input) as ComponentType<
      Record<string, unknown>
    >;
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

  return (
    <FormFieldComponent>
      <FormLabelComponent htmlFor={field.key}>{field.label}</FormLabelComponent>
      <Component {...componentProps} />
      {field.description ? (
        <FormDescriptionComponent>{field.description}</FormDescriptionComponent>
      ) : null}
      {errorMessage ? <FormMessageComponent>{errorMessage}</FormMessageComponent> : null}
      {field.children
        ?.slice()
        .sort((left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER))
        .map((child) => (
          <FieldRenderer key={child.key} field={child} components={componentMap} />
        ))}
    </FormFieldComponent>
  );
}
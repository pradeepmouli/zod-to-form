import type { FormField } from '@zod-to-form/core';

export function getFileHeader(
  schemaImportPath: string,
  exportName: string,
  hasArrays = false,
  mode: 'submit' | 'auto-save' = 'submit',
  componentImportLine?: string
): string {
  const rhfImports = hasArrays
    ? `import { useForm, useFieldArray } from 'react-hook-form';`
    : `import { useForm } from 'react-hook-form';`;

  const reactImports = mode === 'auto-save' ? `import { useEffect } from 'react';` : '';

  return [
    ...(reactImports ? [reactImports] : []),
    rhfImports,
    `import { zodResolver } from '@hookform/resolvers/zod';`,
    ...(componentImportLine ? [componentImportLine] : []),
    `import { ${exportName} } from '${schemaImportPath}';`,
    ``,
    `type FormData = (typeof ${exportName})['_zod']['output'];`
  ].join('\n');
}

function renderInput(field: FormField): string {
  const inputType = typeof field.props['type'] === 'string' ? field.props['type'] : 'text';
  return `<input id="${field.key}" type="${inputType}" {...register('${field.key}')} />`;
}

function renderCheckbox(field: FormField): string {
  return `<input id="${field.key}" type="checkbox" {...register('${field.key}')} />`;
}

function renderDatePicker(field: FormField): string {
  return `<input id="${field.key}" type="date" {...register('${field.key}', { valueAsDate: true })} />`;
}

function renderFileInput(field: FormField): string {
  return `<input id="${field.key}" type="file" {...register('${field.key}')} />`;
}

function renderSelect(field: FormField): string {
  const options = (field.options ?? [])
    .map((option) => `<option value="${String(option.value)}">${option.label}</option>`)
    .join('');

  return `<select id="${field.key}" {...register('${field.key}')}>${options}</select>`;
}

export function renderField(field: FormField): string {
  switch (field.component) {
    case 'Checkbox':
    case 'Switch':
      return renderCheckbox(field);
    case 'DatePicker':
      return renderDatePicker(field);
    case 'FileInput':
      return renderFileInput(field);
    case 'Select':
    case 'RadioGroup':
      return renderSelect(field);
    case 'Textarea':
      return `<textarea id="${field.key}" {...register('${field.key}')} />`;
    default:
      return renderInput(field);
  }
}

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
    `import { z } from 'zod';`,
    ...(componentImportLine ? [componentImportLine] : []),
    `import { ${exportName} } from '${schemaImportPath}';`,
    ``,
    `type StripIndexSignature<T> = T extends readonly (infer U)[]`,
    `  ? StripIndexSignature<U>[]`,
    `  : T extends object`,
    `    ? { [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: StripIndexSignature<T[K]> }`,
    `    : T;`,
    ``,
    `type FormData = StripIndexSignature<z.output<typeof ${exportName}>>;`
  ].join('\n');
}

function registerPathExpr(path: string): string {
  return path.includes('${') ? `register(\`${path}\`)` : `register('${path}')`;
}

function renderInput(field: FormField): string {
  const inputType = typeof field.props['type'] === 'string' ? field.props['type'] : 'text';
  return `<input id="${field.key}" type="${inputType}" {...${registerPathExpr(field.key)}} />`;
}

function renderCheckbox(field: FormField): string {
  return `<input id="${field.key}" type="checkbox" {...${registerPathExpr(field.key)}} />`;
}

function renderDatePicker(field: FormField): string {
  const registerExpr = field.key.includes('${')
    ? `register(\`${field.key}\`, { valueAsDate: true })`
    : `register('${field.key}', { valueAsDate: true })`;
  return `<input id="${field.key}" type="date" {...${registerExpr}} />`;
}

function renderFileInput(field: FormField): string {
  return `<input id="${field.key}" type="file" {...${registerPathExpr(field.key)}} />`;
}

function renderSelect(field: FormField): string {
  const options = (field.options ?? [])
    .map((option) => `<option value="${String(option.value)}">${option.label}</option>`)
    .join('');

  return `<select id="${field.key}" {...${registerPathExpr(field.key)}}>${options}</select>`;
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
      return `<textarea id="${field.key}" {...${registerPathExpr(field.key)}} />`;
    default:
      return renderInput(field);
  }
}

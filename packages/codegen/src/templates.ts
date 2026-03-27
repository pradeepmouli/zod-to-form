import type { FormField } from '@zod-to-form/core';

// ─── Inlined type utility (zero-dep codegen) ─────────────────────────
const STRIP_INDEX_SIGNATURE_TYPE = `type StripIndexSignature<T> = T extends readonly (infer U)[]
  ? StripIndexSignature<U>[]
  : T extends object
    ? {
        [K in keyof T as string extends K
          ? never
          : number extends K
            ? never
            : symbol extends K
              ? never
              : K]: StripIndexSignature<T[K]>;
      }
    : T;`;

// ─── Inlined normalizeFormValues (zero-dep codegen for html preset) ──
const NORMALIZE_FORM_VALUES_BLOCK = `function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.prototype.toString.call(value) === '[object Object]';
}

function isFileListLike(value: unknown): value is FileList & { [index: number]: File } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as {
    length?: unknown;
    item?: unknown;
  };

  return typeof candidate.length === 'number' && typeof candidate.item === 'function';
}

function normalizeFormValues(value: unknown): unknown {
  if (isFileListLike(value)) {
    return value.length > 0 ? (value.item(0) ?? value[0]) : undefined;
  }

  if (value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeFormValues(item));
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      normalizeFormValues(nested)
    ]);

    return Object.fromEntries(entries);
  }

  return value;
}`;

export function getFileHeader(
  schemaImportPath: string,
  exportName: string,
  hasArrays = false,
  mode: 'submit' | 'auto-save' = 'submit',
  componentImportLine?: string,
  options?: { hasControlled?: boolean; formProvider?: boolean; preset?: 'shadcn' | 'html' },
  optimized?: { includeZodResolver: boolean; includeZod: boolean }
): string {
  const rhfParts = ['useForm'];
  if (hasArrays) rhfParts.push('useFieldArray');
  if (options?.hasControlled) rhfParts.push('Controller');
  if (options?.formProvider || mode === 'auto-save') rhfParts.push('FormProvider');
  const rhfImports = `import { ${rhfParts.join(', ')} } from 'react-hook-form';`;

  const reactImports = mode === 'auto-save' ? `import { useEffect } from 'react';` : '';

  const isShadcn = options?.preset === 'shadcn';

  // When optimized, conditionally include zodResolver and zod imports
  const includeZodResolver = optimized ? optimized.includeZodResolver : true;
  const includeZod = optimized ? optimized.includeZod : true;

  return [
    ...(reactImports ? [reactImports] : []),
    rhfImports,
    ...(includeZodResolver ? [`import { zodResolver } from '@hookform/resolvers/zod';`] : []),
    ...(includeZod ? [`import { z } from 'zod';`] : []),
    ...(componentImportLine ? [componentImportLine] : []),
    `import { ${exportName} } from '${schemaImportPath}';`,
    ``,
    STRIP_INDEX_SIGNATURE_TYPE,
    ``,
    ...(includeZod
      ? [`type FormData = StripIndexSignature<z.output<typeof ${exportName}>>;`]
      : [`type FormData = StripIndexSignature<import('zod').output<typeof ${exportName}>>;`]),
    ...(!isShadcn ? [``, NORMALIZE_FORM_VALUES_BLOCK] : [])
  ].join('\n');
}

export function registerPathExpr(path: string): string {
  return path.includes('${') ? `register(\`${path}\`)` : `register('${path}')`;
}

function disabledAttr(field: FormField): string {
  return field.disabled ? ' disabled' : '';
}

function renderInput(field: FormField): string {
  const inputType = typeof field.props['type'] === 'string' ? field.props['type'] : 'text';
  return `<input id="${field.key}" type="${inputType}"${disabledAttr(field)} {...${registerPathExpr(field.key)}} />`;
}

function renderCheckbox(field: FormField): string {
  return `<input id="${field.key}" type="checkbox"${disabledAttr(field)} {...${registerPathExpr(field.key)}} />`;
}

function renderDatePicker(field: FormField): string {
  const registerExpr = field.key.includes('${')
    ? `register(\`${field.key}\`, { valueAsDate: true })`
    : `register('${field.key}', { valueAsDate: true })`;
  return `<input id="${field.key}" type="date"${disabledAttr(field)} {...${registerExpr}} />`;
}

function renderFileInput(field: FormField): string {
  return `<input id="${field.key}" type="file"${disabledAttr(field)} {...${registerPathExpr(field.key)}} />`;
}

function renderSelect(field: FormField): string {
  const options = (field.options ?? [])
    .map((option) => `<option value="${String(option.value)}">${option.label}</option>`)
    .join('');

  return `<select id="${field.key}"${disabledAttr(field)} {...${registerPathExpr(field.key)}}>${options}</select>`;
}

export function renderOptimizedRegister(field: FormField, fieldKey: string): string {
  const mode = field.validation?.mode;

  if (mode === 'native') {
    const rules = field.validation?.rules;
    if (!rules || Object.keys(rules).length === 0) {
      return registerPathExpr(fieldKey);
    }
    const parts: string[] = [];
    if (rules.required !== undefined) {
      parts.push(`required: ${JSON.stringify(rules.required)}`);
    }
    if (rules.minLength !== undefined) {
      parts.push(
        `minLength: { value: ${rules.minLength.value}, message: ${JSON.stringify(rules.minLength.message)} }`
      );
    }
    if (rules.maxLength !== undefined) {
      parts.push(
        `maxLength: { value: ${rules.maxLength.value}, message: ${JSON.stringify(rules.maxLength.message)} }`
      );
    }
    if (rules.min !== undefined) {
      parts.push(
        `min: { value: ${rules.min.value}, message: ${JSON.stringify(rules.min.message)} }`
      );
    }
    if (rules.max !== undefined) {
      parts.push(
        `max: { value: ${rules.max.value}, message: ${JSON.stringify(rules.max.message)} }`
      );
    }
    if (rules.pattern !== undefined) {
      parts.push(
        `pattern: { value: ${rules.pattern.value}, message: ${JSON.stringify(rules.pattern.message)} }`
      );
    }
    const rulesStr = parts.join(', ');
    if (fieldKey.includes('${')) {
      return `register(\`${fieldKey}\`, { ${rulesStr} })`;
    }
    return `register('${fieldKey}', { ${rulesStr} })`;
  }

  if (mode === 'zodSchema') {
    const safeKey = fieldKey.replace(/[^a-zA-Z0-9_]/g, '_');
    if (fieldKey.includes('${')) {
      return `register(\`${fieldKey}\`, { validate: _validate_${safeKey} })`;
    }
    return `register('${fieldKey}', { validate: _validate_${safeKey} })`;
  }

  if (mode === 'component-enforced') {
    return registerPathExpr(fieldKey);
  }

  if (mode === 'watch') {
    const watchFields = field.validation?.watchFields ?? [];
    const safeKey = fieldKey.replace(/[^a-zA-Z0-9_]/g, '_');
    // Emit register with validate that uses watched values
    const watchExpr = watchFields.map((f) => `'${f}'`).join(', ');
    if (fieldKey.includes('${')) {
      return `register(\`${fieldKey}\`, { validate: _watchValidate_${safeKey} /* watch: [${watchExpr}] */ })`;
    }
    return `register('${fieldKey}', { validate: _watchValidate_${safeKey} /* watch: [${watchExpr}] */ })`;
  }

  // undefined validation — backward compatible
  return registerPathExpr(fieldKey);
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
      return `<textarea id="${field.key}"${disabledAttr(field)} {...${registerPathExpr(field.key)}} />`;
    default:
      return renderInput(field);
  }
}

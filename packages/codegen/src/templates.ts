import type { FormField } from '@zod-to-form/core';
import { getFieldRegisterHints } from '@zod-to-form/core';

// ─── Inlined type utility (zero-dep codegen) ─────────────────────────
//
// StripIndexSignature removes index signatures from a type while preserving
// known built-in classes (Date, File, FileList, Blob, RegExp) — without the
// exclusion, the recursion walks into Date's method keys and strips their
// function signatures, producing nonsensical types.
const STRIP_INDEX_SIGNATURE_TYPE = `type StripIndexSignature<T> = T extends Date | File | FileList | Blob | RegExp
  ? T
  : T extends readonly (infer U)[]
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

/**
 * Generate the import block for a form component file.
 * Emits react-hook-form, zodResolver, zod, and component import lines
 * based on the generation options. Also inlines the `StripIndexSignature` utility type
 * and the `normalizeFormValues` helper for html-preset forms.
 *
 * @param schemaImportPath - Module specifier for the schema file (e.g. `'./schema'`).
 * @param exportName - The named schema export to import (e.g. `'UserSchema'`).
 * @param hasArrays - Whether to include `useFieldArray` in the RHF import.
 * @param mode - Form submission mode: `'submit'` (default) or `'auto-save'`.
 * @param componentImportLine - Optional custom import line for the component module.
 * @param options - Additional flags: `hasControlled`, `formProvider`, `preset`.
 * @param optimized - Whether to conditionally include `zodResolver` and `zod` imports.
 * @returns The complete import block as a multi-line string.
 *
 * @remarks
 * The `optimized` parameter controls whether the zodResolver and zod imports are included.
 * When optimization eliminates the need for zodResolver (all fields use native or per-field validation),
 * both can be omitted to reduce bundle size. The `hasControlled` flag adds `Controller` to RHF imports.
 *
 * @example
 * ```ts
 * const header = getFileHeader('./schema', 'UserSchema', false, 'submit', undefined, { preset: 'shadcn' });
 * // → "import { useForm } from 'react-hook-form';\nimport { zodResolver } ..."
 * ```
 *
 * @category Templates
 */
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
    // FormData: form values as handled by RHF (input side — pre-parse).
    // FormOutput: parsed values passed to onSubmit (output side — post-transform).
    // Zod defaults/transforms make input and output differ — RHF uses input.
    ...(includeZod
      ? [
          `type FormData = StripIndexSignature<z.input<typeof ${exportName}>>;`,
          `type FormOutput = StripIndexSignature<z.output<typeof ${exportName}>>;`
        ]
      : [
          `type FormData = StripIndexSignature<import('zod').input<typeof ${exportName}>>;`,
          `type FormOutput = StripIndexSignature<import('zod').output<typeof ${exportName}>>;`
        ]),
    ...(!isShadcn ? [``, NORMALIZE_FORM_VALUES_BLOCK] : [])
  ].join('\n');
}

/**
 * Produce the correct `register(...)` call expression for a field path.
 * Uses template-literal syntax when the path contains `${` (e.g. array item paths),
 * and single-quoted string syntax otherwise.
 *
 * @param path - The field path string (e.g. `"name"`, `"items.${index}.value"`).
 * @returns A `register('...')` or `register(\`...\`)` expression string for inclusion in JSX.
 *
 * @example registerPathExpr('name') → "register('name')"
 * @example registerPathExpr('items.${index}.name') → "register(`items.${index}.name`)"
 *
 * @category Templates
 */
export function registerPathExpr(path: string): string {
  return path.includes('${') ? `register(\`${path}\`)` : `register('${path}')`;
}

/**
 * Build a register-options object literal string from a field's coercion hints.
 *
 * Returns the options parts that should appear inside `register(key, { ... })`.
 * Only emits coercion options (valueAsNumber, valueAsDate, setValueAs).
 * Validation rules (nativeRules, validate) are handled separately by
 * `renderOptimizedRegister` in the optimized path and are NOT included here,
 * so the non-optimized path stays compatible with the existing zodResolver flow.
 *
 * Returns an empty array when no coercion options apply (bare register).
 *
 * @internal
 */
function buildCoercionOptionParts(field: FormField): string[] {
  const hints = getFieldRegisterHints(field);
  const parts: string[] = [];

  if (hints.valueAsNumber) {
    parts.push('valueAsNumber: true');
  }
  if (hints.valueAsDate) {
    parts.push('valueAsDate: true');
  }
  if (hints.setValueAs === 'file') {
    // Mirror the exact lambda that @zod-to-form/react uses at runtime so that
    // generated forms and the runtime renderer behave identically.
    parts.push(
      'setValueAs: (value: unknown) => { if (value instanceof FileList) { return value.length > 0 ? value.item(0) : undefined; } return value; }'
    );
  }

  return parts;
}

/**
 * Build a complete `register(path, { coercion })` expression string for a field.
 *
 * When the field has no coercion hints the result is identical to `registerPathExpr(path)`.
 * Extra option parts (validation rules) may be merged in by passing `extraParts`.
 *
 * Exported so `generate.ts` can use it for custom mapped components.
 *
 * @internal
 */
export function buildRegisterExpr(field: FormField, extraParts: string[] = []): string {
  const coercionParts = buildCoercionOptionParts(field);
  const allParts = [...coercionParts, ...extraParts];

  const path = field.key;
  const pathToken = path.includes('${') ? `\`${path}\`` : `'${path}'`;

  if (allParts.length === 0) {
    return `register(${pathToken})`;
  }
  return `register(${pathToken}, { ${allParts.join(', ')} })`;
}

function disabledAttr(field: FormField): string {
  return field.disabled ? ' disabled' : '';
}

function renderInput(field: FormField, regExpr?: string): string {
  const inputType = typeof field.props['type'] === 'string' ? field.props['type'] : 'text';
  const reg = regExpr ?? buildRegisterExpr(field);
  return `<input id="${field.key}" type="${inputType}"${disabledAttr(field)} {...${reg}} />`;
}

function renderCheckbox(field: FormField, regExpr?: string): string {
  // Checkbox/Switch fields are boolean — no numeric/date coercion applies.
  const reg = regExpr ?? registerPathExpr(field.key);
  return `<input id="${field.key}" type="checkbox"${disabledAttr(field)} {...${reg}} />`;
}

function renderDatePicker(field: FormField, regExpr?: string): string {
  // DatePicker always renders <input type="date"> so valueAsDate: true is always
  // required — hardcode it as the baseline and merge any additional coercion hints.
  // When a pre-built regExpr is passed (e.g. from renderOptimizedRegister) use it as-is.
  if (regExpr) {
    return `<input id="${field.key}" type="date"${disabledAttr(field)} {...${regExpr}} />`;
  }
  // Derive coercion parts from hints; ensure valueAsDate is always present.
  const coercionParts = buildCoercionOptionParts(field);
  if (!coercionParts.includes('valueAsDate: true')) {
    coercionParts.unshift('valueAsDate: true');
  }
  const path = field.key;
  const pathToken = path.includes('${') ? `\`${path}\`` : `'${path}'`;
  const reg = `register(${pathToken}, { ${coercionParts.join(', ')} })`;
  return `<input id="${field.key}" type="date"${disabledAttr(field)} {...${reg}} />`;
}

function renderFileInput(field: FormField, regExpr?: string): string {
  // File fields carry setValueAs coercion (derived from zodType === 'file').
  const reg = regExpr ?? buildRegisterExpr(field);
  return `<input id="${field.key}" type="file"${disabledAttr(field)} {...${reg}} />`;
}

function renderSelect(field: FormField, regExpr?: string): string {
  const options = (field.options ?? [])
    .map((option) => `<option value="${String(option.value)}">${option.label}</option>`)
    .join('');
  // Select values are strings/enums — no coercion normally applies.
  // buildRegisterExpr handles the no-op case gracefully (returns bare register).
  const reg = regExpr ?? buildRegisterExpr(field);
  return `<select id="${field.key}"${disabledAttr(field)} {...${reg}}>${options}</select>`;
}

export function renderOptimizedRegister(field: FormField, fieldKey: string): string {
  const mode = field.validation?.mode;
  // Coercion options (valueAsNumber, valueAsDate, setValueAs) always come first
  // so that RHF parses the value before running validation rules.
  const coercionParts = buildCoercionOptionParts(field);
  const pathToken = fieldKey.includes('${') ? `\`${fieldKey}\`` : `'${fieldKey}'`;

  if (mode === 'native') {
    const rules = field.validation?.rules;
    const validationParts: string[] = [];
    if (rules && Object.keys(rules).length > 0) {
      if (rules.required !== undefined) {
        validationParts.push(`required: ${JSON.stringify(rules.required)}`);
      }
      if (rules.minLength !== undefined) {
        validationParts.push(
          `minLength: { value: ${rules.minLength.value}, message: ${JSON.stringify(rules.minLength.message)} }`
        );
      }
      if (rules.maxLength !== undefined) {
        validationParts.push(
          `maxLength: { value: ${rules.maxLength.value}, message: ${JSON.stringify(rules.maxLength.message)} }`
        );
      }
      if (rules.min !== undefined) {
        validationParts.push(
          `min: { value: ${rules.min.value}, message: ${JSON.stringify(rules.min.message)} }`
        );
      }
      if (rules.max !== undefined) {
        validationParts.push(
          `max: { value: ${rules.max.value}, message: ${JSON.stringify(rules.max.message)} }`
        );
      }
      if (rules.pattern !== undefined) {
        validationParts.push(
          `pattern: { value: ${rules.pattern.value}, message: ${JSON.stringify(rules.pattern.message)} }`
        );
      }
    }
    const allParts = [...coercionParts, ...validationParts];
    if (allParts.length === 0) {
      return `register(${pathToken})`;
    }
    return `register(${pathToken}, { ${allParts.join(', ')} })`;
  }

  if (mode === 'zodSchema') {
    const safeKey = fieldKey.replace(/[^a-zA-Z0-9_]/g, '_');
    const validatePart = `validate: _validate_${safeKey}`;
    const allParts = [...coercionParts, validatePart];
    return `register(${pathToken}, { ${allParts.join(', ')} })`;
  }

  if (mode === 'component-enforced') {
    // component-enforced: no validation emitted, but coercion still applies
    if (coercionParts.length === 0) {
      return `register(${pathToken})`;
    }
    return `register(${pathToken}, { ${coercionParts.join(', ')} })`;
  }

  // TODO(L3): Handle watch mode when cross-field optimization is implemented
  // if (mode === 'watch') { ... }

  // undefined validation — emit coercion if present, otherwise bare register
  if (coercionParts.length === 0) {
    return `register(${pathToken})`;
  }
  return `register(${pathToken}, { ${coercionParts.join(', ')} })`;
}

/**
 * Render a single `FormField` to its plain-HTML JSX string.
 * Dispatches on `field.component` to produce the correct input element.
 * Used by the html-preset code generator for uncontrolled forms.
 *
 * @param field - The FormField to render.
 * @param regExpr - Optional pre-built `register(...)` expression string. If omitted, generated from `field.key`.
 * @returns A JSX string for the field's input element (e.g. `<input type="text" {...register('name')} />`).
 *
 * @example renderField({ component: 'Input', key: 'name', props: { type: 'text' }, ... }) → "<input ... />"
 *
 * @category Templates
 */
export function renderField(field: FormField, regExpr?: string): string {
  switch (field.component) {
    case 'Checkbox':
    case 'Switch':
      return renderCheckbox(field, regExpr);
    case 'DatePicker':
      return renderDatePicker(field, regExpr);
    case 'FileInput':
      return renderFileInput(field, regExpr);
    case 'Select':
    case 'RadioGroup':
      return renderSelect(field, regExpr);
    case 'Textarea': {
      const reg = regExpr ?? buildRegisterExpr(field);
      return `<textarea id="${field.key}"${disabledAttr(field)} {...${reg}} />`;
    }
    default:
      return renderInput(field, regExpr);
  }
}

import type { ZodType } from 'zod';
import { inferLabel } from '../utils.js';
import type { FormField, FormFieldOption, FormProcessorContext, ProcessParams } from '../types.js';
import { getDef } from './_utils.js';

function normalizeOptions(values: unknown[]): FormFieldOption[] {
  const options: FormFieldOption[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string' && typeof value !== 'number') {
      continue;
    }
    const key = `${typeof value}:${String(value)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    options.push({ value, label: inferLabel(String(value)) });
  }

  return options;
}

export function processEnum(
  schema: ZodType,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const def = getDef(schema);
  const entries = def['entries'] as Record<string, unknown> | undefined;
  const values = def['values'] as unknown[] | undefined;

  const enumValues = entries ? Object.values(entries) : (values ?? []);

  field.component = 'Select';
  field.options = normalizeOptions(enumValues);
}

export function processLiteral(
  schema: ZodType,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const def = getDef(schema);
  const literalValuesRaw =
    (def['values'] as unknown[] | undefined) ?? (def['value'] !== undefined ? [def['value']] : []);

  field.component = 'Select';
  field.readOnly = true;
  field.options = normalizeOptions(literalValuesRaw);
}

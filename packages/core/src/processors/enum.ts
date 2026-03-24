import type { $ZodEnum, $ZodLiteral } from 'zod/v4/core';
import { inferLabel } from '../utils.js';
import type { FormField, FormFieldOption, FormProcessorContext, ProcessParams } from '../types.js';

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
  schema: $ZodEnum,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const def = schema._zod.def;
  const entries = def.entries;

  const enumValues = Object.values(entries);

  field.component = 'Select';
  field.options = normalizeOptions(enumValues);
}

export function processLiteral(
  schema: $ZodLiteral,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const def = schema._zod.def;
  const literalValuesRaw = def.values ?? [];

  field.component = 'Select';
  field.readOnly = true;
  field.options = normalizeOptions(literalValuesRaw);
}

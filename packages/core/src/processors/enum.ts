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

/**
 * Process `z.enum()` — renders as a `Select` component with options derived from enum entries.
 * Duplicate values are deduplicated, and labels are generated via `inferLabel`.
 *
 * @param schema - The `$ZodEnum` schema whose entries define the select options.
 * @param _ctx - The walker context (unused for enum processing).
 * @param field - The base FormField to mutate in-place.
 * @param _params - Unused; included for processor signature conformance.
 *
 * @category Processors
 */
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

/**
 * Process `z.literal()` — renders as a read-only `Select` with a single fixed option.
 * The field is marked `readOnly` because literal fields have exactly one valid value.
 *
 * @param schema - The `$ZodLiteral` schema whose values define the select options.
 * @param _ctx - The walker context (unused for literal processing).
 * @param field - The base FormField to mutate in-place.
 * @param _params - Unused; included for processor signature conformance.
 *
 * @category Processors
 */
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

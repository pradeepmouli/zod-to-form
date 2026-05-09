import type { $ZodDate, $ZodISODate } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

/**
 * Process `z.date()` / `z.iso.date()` — renders as a `DatePicker` component.
 * No constraints are extracted from the date schema — date validation is handled by the resolver.
 *
 * @param _schema - The date schema (unused; date type has no constraint bag entries).
 * @param _ctx - The walker context (unused for date processing).
 * @param field - The base FormField to mutate in-place.
 * @param _params - Unused; included for processor signature conformance.
 *
 * @category Processors
 */
export function processDate(
  _schema: $ZodDate | $ZodISODate,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  field.component = 'DatePicker';
}

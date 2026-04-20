import type { $ZodType as ZodType } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

/**
 * Process `z.file()` — renders as a `FileInput` component.
 * No constraints are extracted. The field renderer sets `valueAsFile: true` on registration
 * so RHF stores a `File` object rather than the raw input value.
 *
 * @param _schema - The file schema (unused; no bag constraints for files).
 * @param _ctx - The walker context (unused for file processing).
 * @param field - The base FormField to mutate in-place.
 * @param _params - Unused; included for processor signature conformance.
 *
 * @category Processors
 */
export function processFile(
  _schema: ZodType,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  field.component = 'FileInput';
}

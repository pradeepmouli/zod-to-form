import type { $ZodType as ZodType } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

/**
 * Fallback processor for Zod types without a dedicated handler.
 * Renders as a plain text `Input`, preserving the schema's `def.type` on the field.
 * Used for `custom`, `any`, `unknown`, `nan`, `void`, `null`, `undefined`, `symbol`,
 * `transform`, `promise`, `function`, and other exotic types.
 *
 * @param schema - The unhandled Zod schema.
 * @param _ctx - The walker context (unused by the fallback).
 * @param field - The base FormField to mutate in-place.
 * @param _params - Unused; included for processor signature conformance.
 *
 * @category Processors
 */
export function processFallback(
  schema: ZodType,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  field.zodType = schema._zod.def.type ?? field.zodType;
  field.component = 'Input';
  field.props = {
    ...field.props,
    type: 'text'
  };
}

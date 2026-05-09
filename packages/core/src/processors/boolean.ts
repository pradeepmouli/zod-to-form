import type { $ZodBoolean } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

/**
 * Process `z.boolean()` — renders as a `Checkbox` component (or a component override from the registry).
 * Marks the field as required since boolean fields always have a value (true/false).
 *
 * @param schema - The `$ZodBoolean` schema to process.
 * @param ctx - The walker context providing the form registry for component overrides.
 * @param field - The base FormField to mutate in-place.
 * @param _params - Unused; included for processor signature conformance.
 *
 * @remarks
 * Component can be overridden via `z.registry<FormMeta>()` with `{ component: 'Switch' }`.
 * The `required: true` default reflects that a boolean always resolves to true or false — never undefined.
 *
 * @category Processors
 */
export function processBoolean(
  schema: $ZodBoolean,
  ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const meta = ctx.formRegistry?.get(schema);

  field.component = meta?.component ?? 'Checkbox';
  field.required = true;
}

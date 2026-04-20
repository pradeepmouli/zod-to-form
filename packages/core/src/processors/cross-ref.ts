import type { $ZodType as ZodType } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

/**
 * Process a cross-reference field — a schema annotated in the form registry with `refType`.
 * Renders as a `cross-ref` component placeholder that the consuming application resolves
 * to a form-linked picker or relationship field at runtime.
 *
 * @param schema - The Zod schema annotated with `{ props: { refType: 'EntityName' } }` in the registry.
 * @param ctx - The walker context providing the form registry for metadata lookup.
 * @param field - The base FormField to mutate in-place.
 * @param _params - Unused; included for processor signature conformance.
 *
 * @remarks
 * Cross-ref is not a built-in Zod type — it is activated by registering a schema in the form
 * registry with `{ props: { refType: 'EntityName' } }` and manually mapping it in the processor
 * registry to `processCrossRef`. The component name `"cross-ref"` must be mapped in the component module.
 *
 * @category Processors
 */
export function processCrossRef(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  field.component = 'cross-ref';

  const meta = ctx.formRegistry?.get(schema);
  const refType = meta?.props?.['refType'];

  if (typeof refType === 'string' && refType.length > 0) {
    field.props['refType'] = refType;
  }
}

import type { $ZodRecord } from 'zod/v4/core';
import { createBaseField } from '../utils.js';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

/**
 * Process `z.record()` — renders as a plain `Input` with an item template derived from the value type.
 * The item template is stored in `field.arrayItem` for codegen to use in dynamic key-value entry forms.
 *
 * @param schema - The `$ZodRecord` schema whose `valueType` drives the item template.
 * @param _ctx - The walker context (unused for record processing).
 * @param field - The base FormField to mutate in-place.
 * @param _params - Unused; included for processor signature conformance.
 *
 * @category Processors
 */
export function processRecord(
  schema: $ZodRecord,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  field.component = 'Input';

  const valueType = schema._zod.def.valueType;
  const itemZodType = valueType._zod.def.type;
  field.arrayItem = createBaseField(`${field.key}.$item`, itemZodType);
}

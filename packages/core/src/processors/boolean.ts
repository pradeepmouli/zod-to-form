import type { $ZodType as ZodType } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

export function processBoolean(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const meta = ctx.formRegistry?.get(schema);

  field.component = meta?.component ?? 'Checkbox';
  field.required = true;
}

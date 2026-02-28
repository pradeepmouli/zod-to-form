import type { ZodType } from 'zod';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

export function processBoolean(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const meta = ctx.formRegistry?.get(schema);
  const fieldType = meta?.fieldType?.toLowerCase();

  field.component = fieldType === 'switch' ? 'Switch' : 'Checkbox';
  field.required = true;
}

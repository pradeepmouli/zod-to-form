import type { $ZodRecord } from 'zod/v4/core';
import { createBaseField } from '../utils.js';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

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

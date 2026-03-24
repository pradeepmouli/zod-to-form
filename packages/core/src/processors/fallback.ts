import type { $ZodType as ZodType } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

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

import type { ZodType } from 'zod';
import { createBaseField } from '../utils.js';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';
import { getDef } from './_utils.js';

function processRecord(field: FormField): void {
  field.component = 'Input';
  field.arrayItem = createBaseField(`${field.key}.$item`, 'record_entry');
}

export function processFallback(
  schema: ZodType,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const def = getDef(schema);
  const zodType = typeof def['type'] === 'string' ? (def['type'] as string) : field.zodType;

  field.zodType = zodType;

  if (zodType === 'record') {
    processRecord(field);
    return;
  }

  field.component = 'Input';
  field.props = {
    ...field.props,
    type: 'text'
  };
}

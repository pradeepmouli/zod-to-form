import type { ZodType } from 'zod';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

export function processDate(
  _schema: ZodType,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  field.component = 'DatePicker';
}
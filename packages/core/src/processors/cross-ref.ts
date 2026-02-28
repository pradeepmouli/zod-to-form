import type { ZodType } from 'zod';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

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

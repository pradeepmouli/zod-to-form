import type { ZodType } from 'zod';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';
import { getDef, getBag } from './_utils.js';

export function processNumber(
  schema: ZodType,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const def = getDef(schema);
  const bag = getBag(schema);
  const minimum = typeof bag['minimum'] === 'number' ? bag['minimum'] : undefined;
  const maximum = typeof bag['maximum'] === 'number' ? bag['maximum'] : undefined;

  const checks = Array.isArray(def['checks']) ? def['checks'] : [];
  const hasIntegerConstraint = checks.some((check) => {
    const value = check as Record<string, unknown>;
    const nested =
      (value['def'] as Record<string, unknown> | undefined) ??
      (value['_zod'] as { def?: Record<string, unknown> } | undefined)?.['def'] ??
      {};
    return (
      value['kind'] === 'int' ||
      value['check'] === 'int' ||
      nested['check'] === 'number_format' ||
      nested['format'] === 'int' ||
      nested['format'] === 'safeint'
    );
  });

  field.component = 'Input';
  field.props = {
    ...field.props,
    type: 'number'
  };

  if (minimum !== undefined) {
    field.constraints.min = minimum;
    field.props['min'] = minimum;
  }
  if (maximum !== undefined) {
    field.constraints.max = maximum;
    field.props['max'] = maximum;
  }
  if (hasIntegerConstraint) {
    field.constraints.step = 1;
    field.props['step'] = 1;
  }
}

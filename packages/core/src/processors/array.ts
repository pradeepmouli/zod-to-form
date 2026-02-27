import type { ZodType } from 'zod';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

function getDef(schema: ZodType): Record<string, unknown> {
  return (schema as unknown as { _zod?: { def?: Record<string, unknown> } })['_zod']?.['def'] ?? {};
}

function getBag(schema: ZodType): Record<string, unknown> {
  return (schema as unknown as { _zod?: { bag?: Record<string, unknown> } })['_zod']?.['bag'] ?? {};
}

export function processArray(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  field.component = 'ArrayField';

  const def = getDef(schema);
  const bag = getBag(schema);

  const minimum = typeof bag['minimum'] === 'number' ? bag['minimum'] : undefined;
  const maximum = typeof bag['maximum'] === 'number' ? bag['maximum'] : undefined;

  if (minimum !== undefined) {
    field.constraints.minLength = minimum;
  }
  if (maximum !== undefined) {
    field.constraints.maxLength = maximum;
  }

  const elementSchema = def['element'] as ZodType | undefined;

  if (elementSchema && ctx.processChild) {
    const itemKey = params.parentKey ? `${params.parentKey}.0` : '0';
    field.arrayItem = ctx.processChild(elementSchema, itemKey);
  }
}

export function processTuple(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  field.component = 'Fieldset';

  const def = getDef(schema);
  const items = def['items'] as ZodType[] | undefined;

  if (!items || !ctx.processChild) {
    field.children = [];
    return;
  }

  field.children = items.map((itemSchema, index) => {
    const itemKey = params.parentKey ? `${params.parentKey}.${index}` : `${index}`;
    return ctx.processChild!(itemSchema, itemKey);
  });
}

import type { $ZodArray, $ZodTuple, $ZodType as ZodType } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

export function processArray(
  schema: $ZodArray,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  field.component = 'ArrayField';

  const bag = schema._zod.bag;

  const minimum = typeof bag['minimum'] === 'number' ? bag['minimum'] : undefined;
  const maximum = typeof bag['maximum'] === 'number' ? bag['maximum'] : undefined;

  if (minimum !== undefined) {
    field.constraints.minLength = minimum;
  }
  if (maximum !== undefined) {
    field.constraints.maxLength = maximum;
  }

  const elementSchema = schema._zod.def.element;

  if (elementSchema && ctx.processChild) {
    const itemKey = params.parentKey ? `${params.parentKey}.0` : '0';
    field.arrayItem = ctx.processChild(elementSchema, itemKey);
  }
}

export function processTuple(
  schema: $ZodTuple,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  field.component = 'Fieldset';

  const items = schema._zod.def.items;

  if (!items || !ctx.processChild) {
    field.children = [];
    return;
  }

  field.children = (items as readonly ZodType[]).map((itemSchema, index) => {
    const itemKey = params.parentKey ? `${params.parentKey}.${index}` : `${index}`;
    return ctx.processChild!(itemSchema, itemKey);
  });
}

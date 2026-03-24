import type { $ZodObject, $ZodIntersection, $ZodType as ZodType } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';
import { inferLabel, joinPath } from '../utils.js';

function processShapeEntries(
  shape: Record<string, ZodType>,
  parentKey: string | undefined,
  ctx: FormProcessorContext
): FormField[] {
  if (!ctx.processChild) {
    return [];
  }

  return Object.entries(shape).map(([key, childSchema]) => {
    const fullKey = joinPath(parentKey, key);
    return ctx.processChild!(childSchema, fullKey);
  });
}

export function processObject(
  schema: $ZodObject,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  field.component = 'Fieldset';
  field.label = field.label || inferLabel(params.parentKey ?? field.key);

  const shape = schema._zod.def.shape as Record<string, ZodType>;
  field.children = processShapeEntries(shape, params.parentKey, ctx);
}

export function processIntersection(
  schema: $ZodIntersection,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  field.component = 'Fieldset';

  const def = schema._zod.def;
  const left = def.left as ZodType | undefined;
  const right = def.right as ZodType | undefined;

  const children: FormField[] = [];

  if (left) {
    const leftShape = (left._zod.def as { shape?: Record<string, ZodType> }).shape;
    if (leftShape) {
      children.push(...processShapeEntries(leftShape, params.parentKey, ctx));
    }
  }

  if (right) {
    const rightShape = (right._zod.def as { shape?: Record<string, ZodType> }).shape;
    if (rightShape) {
      children.push(...processShapeEntries(rightShape, params.parentKey, ctx));
    }
  }

  field.children = children;
}

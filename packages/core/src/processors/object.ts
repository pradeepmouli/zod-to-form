import type { ZodType } from 'zod';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';
import { inferLabel, joinPath } from '../utils.js';
import { getDef, getShape } from './_utils.js';

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
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  field.component = 'Fieldset';
  field.label = field.label || inferLabel(params.parentKey ?? field.key);

  const def = getDef(schema);
  const shape = getShape(def);
  field.children = processShapeEntries(shape, params.parentKey, ctx);
}

export function processIntersection(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  field.component = 'Fieldset';

  const def = getDef(schema);
  const left = def['left'] as ZodType | undefined;
  const right = def['right'] as ZodType | undefined;

  const children: FormField[] = [];

  if (left) {
    const leftDef = getDef(left);
    const leftShape = getShape(leftDef);
    children.push(...processShapeEntries(leftShape, params.parentKey, ctx));
  }

  if (right) {
    const rightDef = getDef(right);
    const rightShape = getShape(rightDef);
    children.push(...processShapeEntries(rightShape, params.parentKey, ctx));
  }

  field.children = children;
}

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

/**
 * Process `z.object()` — renders as a `Fieldset` with each shape key as a child field.
 * Recursively processes all shape entries via `ctx.processChild`.
 *
 * @param schema - The `$ZodObject` schema whose shape defines the child fields.
 * @param ctx - The walker context providing child processing.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata for constructing nested field keys.
 *
 * @remarks
 * The fieldset label is inferred from `params.parentKey` or `field.key` via `inferLabel`.
 * Schema-level metadata (title, description) can override the inferred label via `resolveMetadata`.
 *
 * @category Processors
 */
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

/**
 * Process `z.intersection()` — renders as a `Fieldset` that merges the left and right shape entries.
 * Both the left and right schemas must be `z.object()` types for their shapes to be merged.
 * Non-object intersection members are silently skipped.
 *
 * @param schema - The `$ZodIntersection` schema whose left/right shapes are merged.
 * @param ctx - The walker context providing child processing.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata for constructing nested field keys.
 *
 * @category Processors
 */
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

import type { $ZodArray, $ZodTuple, $ZodType as ZodType } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

/**
 * Process `z.array()` — renders as an `ArrayField` component with an item template.
 * Extracts `minLength`/`maxLength` from the constraint bag and recurses on the element type.
 *
 * @param schema - The `$ZodArray` schema to process.
 * @param ctx - The walker context providing processor registry and child processing.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata for constructing the item template key.
 *
 * @remarks
 * The item template is constructed at key `parentKey.0` (first index).
 * The runtime ArrayBlock and codegen both use `field.arrayItem` to build the repeater.
 *
 * @category Processors
 */
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

/**
 * Process `z.tuple()` — renders as a `Fieldset` where each tuple item becomes a child field.
 * Tuple items are keyed by their index (e.g. `"tupleField.0"`, `"tupleField.1"`).
 *
 * @param schema - The `$ZodTuple` schema to process.
 * @param ctx - The walker context providing child processing.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata for constructing item keys.
 *
 * @remarks
 * Fixed-length tuples render all items eagerly. Rest elements are not currently supported
 * and will produce an empty children array if present.
 *
 * @category Processors
 */
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

import type { $ZodMap, $ZodSet } from 'zod/v4/core';
import { createBaseField } from '../utils.js';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

/**
 * Process `z.set()` — renders as an array-like repeater of unique items.
 * The value type determines the item template stored in `field.arrayItem`.
 *
 * @param schema - The `$ZodSet` schema whose `valueType` drives the item template.
 * @param ctx - The walker context providing child processing.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata for constructing the item template key.
 *
 * @category Processors
 */
export function processSet(
  schema: $ZodSet,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  field.component = 'ArrayField';

  const valueType = schema._zod.def.valueType;

  if (ctx.processChild) {
    const itemKey = params.parentKey ? `${params.parentKey}.0` : '0';
    field.arrayItem = ctx.processChild(valueType, itemKey);
  }
}

/**
 * Process `z.map()` — renders as an array-like repeater of key-value pair fieldsets.
 * Each entry has a `key` field and a `value` field derived from the Map's type params.
 *
 * @param schema - The `$ZodMap` schema whose `keyType` and `valueType` drive the entry fieldset.
 * @param ctx - The walker context providing child processing for key and value fields.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata for constructing the entry fieldset key.
 *
 * @category Processors
 */
export function processMap(
  schema: $ZodMap,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  field.component = 'ArrayField';

  const keyType = schema._zod.def.keyType;
  const valueType = schema._zod.def.valueType;

  // Each map entry is a fieldset with key + value children
  const entryKey = params.parentKey ? `${params.parentKey}.0` : '0';
  const entryField = createBaseField(entryKey, 'object');
  entryField.component = 'Fieldset';
  entryField.label = 'Entry';

  if (ctx.processChild) {
    const keyField = ctx.processChild(keyType, `${entryKey}.key`);
    keyField.label = 'Key';
    const valueField = ctx.processChild(valueType, `${entryKey}.value`);
    valueField.label = 'Value';
    entryField.children = [keyField, valueField];
  }

  field.arrayItem = entryField;
}

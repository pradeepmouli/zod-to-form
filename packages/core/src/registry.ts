import type { FormProcessor } from './types.js';
import { processArray, processTuple } from './processors/array.js';
import { processBoolean } from './processors/boolean.js';
import { processMap, processSet } from './processors/collections.js';
import { processDate } from './processors/date.js';
import { processEnum, processLiteral } from './processors/enum.js';
import { processFallback } from './processors/fallback.js';
import { processFile } from './processors/file.js';
import { processNumber } from './processors/number.js';
import { processObject, processIntersection } from './processors/object.js';
import { processRecord } from './processors/record.js';
import { processString, processTemplateLiteral } from './processors/string.js';
import { processUnion } from './processors/union.js';
import {
  processDefault,
  processLazy,
  processNullable,
  processOptional,
  processPipe,
  processReadonly
} from './processors/wrappers.js';
import type { $ZodTypes } from 'zod/v4/core';

/**
 * Typed processor map — compile-time check ensures each processor's schema
 * parameter matches the Zod type it handles. Covers all types in `$ZodTypes`.
 */
const typedProcessors: { [K in $ZodTypes as K['_zod']['def']['type']]: FormProcessor<K> } = {
  string: processString,
  template_literal: processTemplateLiteral,
  number: processNumber,
  bigint: processNumber,
  boolean: processBoolean,
  date: processDate,
  enum: processEnum,
  literal: processLiteral,
  file: processFile,
  object: processObject,
  record: processRecord,
  array: processArray,
  tuple: processTuple,
  union: processUnion,
  intersection: processIntersection,
  lazy: processLazy,
  optional: processOptional,
  nullable: processNullable,
  default: processDefault,
  prefault: processDefault,
  readonly: processReadonly,
  pipe: processPipe,
  transform: processFallback,
  custom: processFallback,
  any: processFallback,
  unknown: processFallback,
  nan: processFallback,
  void: processFallback,
  never: processFallback,
  null: processFallback,
  undefined: processFallback,
  symbol: processFallback,
  map: processMap,
  set: processSet,
  function: processFallback,
  promise: processFallback,
  catch: processFallback,
  success: processFallback,
  nonoptional: processFallback
};

// Safety: typed map verifies processor/schema alignment at compile time.
// Runtime registry widens to FormProcessor since walker dispatches by def.type string.
// Note: discriminated unions have def.type "union" (not "discriminated_union") —
// processUnion detects the discriminator property and delegates to processDiscriminatedUnion.
export const builtinProcessors: Record<string, FormProcessor> =
  typedProcessors as unknown as Record<string, FormProcessor>;

/**
 * Create a custom processor registry by merging with built-in processors.
 */
export function createProcessors(
  custom: Record<string, FormProcessor>
): Record<string, FormProcessor> {
  return { ...builtinProcessors, ...custom };
}

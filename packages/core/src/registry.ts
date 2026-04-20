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

/**
 * The default processor registry — maps every Zod v4 `def.type` string to its processor.
 * The typed `typedProcessors` constant provides compile-time safety; this export widens
 * to `Record<string, FormProcessor>` for runtime dispatch.
 *
 * @category Registry
 */
export const builtinProcessors = typedProcessors as unknown as Record<string, FormProcessor>;

/**
 * Create a custom processor registry by merging with built-in processors.
 * Custom entries override built-in processors for the same `def.type` key.
 *
 * @param custom - Additional or override processors keyed by Zod `def.type` (e.g. `'string'`, `'myCustomType'`).
 * @returns A merged registry of built-in and custom processors ready for use with `walkSchema`.
 *
 * @category Registry
 */
export function createProcessors(
  custom: Record<string, FormProcessor>
): Record<string, FormProcessor> {
  return { ...builtinProcessors, ...custom };
}

import type { FormProcessor } from './types.js';
import { processBoolean } from './processors/boolean.js';
import { processDate } from './processors/date.js';
import { processEnum, processLiteral } from './processors/enum.js';
import { processFallback } from './processors/fallback.js';
import { processFile } from './processors/file.js';
import { processNumber } from './processors/number.js';
import { processString, processTemplateLiteral } from './processors/string.js';
import {
  processDefault,
  processNullable,
  processOptional,
  processPipe,
  processReadonly
} from './processors/wrappers.js';

export const builtinProcessors: Record<string, FormProcessor> = {
  string: processString,
  template_literal: processTemplateLiteral,
  number: processNumber,
  bigint: processNumber,
  boolean: processBoolean,
  date: processDate,
  enum: processEnum,
  nativeEnum: processEnum,
  literal: processLiteral,
  file: processFile,
  optional: processOptional,
  nullable: processNullable,
  default: processDefault,
  readonly: processReadonly,
  pipe: processPipe,
  transform: processFallback,
  custom: processFallback,
  any: processFallback,
  unknown: processFallback,
  record: processFallback
};

/**
 * Create a custom processor registry by merging with built-in processors.
 *
 * @param custom - Custom processors to add or override
 * @returns Merged processor registry
 */
export function createProcessors(
  custom: Record<string, FormProcessor>
): Record<string, FormProcessor> {
  return { ...builtinProcessors, ...custom };
}

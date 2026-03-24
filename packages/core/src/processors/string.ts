import type { $ZodString, $ZodTemplateLiteral } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';
import { regexToMask } from '../utils.js';

export function processString(
  schema: $ZodString,
  ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const bag = schema._zod.bag;
  const meta = ctx.formRegistry?.get(schema);
  const format = typeof bag['format'] === 'string' ? bag['format'] : undefined;
  const minimum = typeof bag['minimum'] === 'number' ? bag['minimum'] : undefined;
  const maximum = typeof bag['maximum'] === 'number' ? bag['maximum'] : undefined;
  // bag.patterns holds a Set<RegExp> — take the first regex's source
  const patternsSet = bag['patterns'];
  const pattern =
    patternsSet instanceof Set && patternsSet.size > 0
      ? ([...patternsSet][0] as RegExp).source
      : undefined;

  field.component = meta?.component ?? 'Input';
  field.props = {
    ...field.props,
    type: format === 'email' || format === 'url' ? format : 'text'
  };

  if (format) {
    field.constraints.format = format;
  }
  if (minimum !== undefined) {
    field.constraints.minLength = minimum;
    field.props['minLength'] = minimum;
  }
  if (maximum !== undefined) {
    field.constraints.maxLength = maximum;
    field.props['maxLength'] = maximum;
  }
  if (pattern) {
    field.constraints.pattern = pattern;
    field.props['pattern'] = pattern;
    const mask = regexToMask(pattern);
    if (mask !== null) {
      field.props['inputMask'] = mask;
    }
  }
}

export function processTemplateLiteral(
  schema: $ZodTemplateLiteral,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  field.component = 'Input';
  field.props = {
    ...field.props,
    type: 'text'
  };
  field.zodType = schema._zod.def.type;
}

import type { ZodType } from 'zod';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';
import { regexToMask } from '../utils.js';
import { getDef, getBag } from './_utils.js';

export function processString(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const bag = getBag(schema);
  const meta = ctx.formRegistry?.get(schema);
  const fieldType = meta?.fieldType?.toLowerCase();
  const format = typeof bag['format'] === 'string' ? bag['format'] : undefined;
  const minimum = typeof bag['minimum'] === 'number' ? bag['minimum'] : undefined;
  const maximum = typeof bag['maximum'] === 'number' ? bag['maximum'] : undefined;
  // bag.patterns holds a Set<RegExp> — take the first regex's source
  const patternsSet = bag['patterns'];
  const pattern =
    patternsSet instanceof Set && patternsSet.size > 0
      ? ([...patternsSet][0] as RegExp).source
      : undefined;

  field.component = fieldType === 'textarea' ? 'Textarea' : 'Input';
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
  schema: ZodType,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const def = getDef(schema);
  field.component = 'Input';
  field.props = {
    ...field.props,
    type: 'text'
  };
  field.zodType = typeof def['type'] === 'string' ? (def['type'] as string) : 'template_literal';
}

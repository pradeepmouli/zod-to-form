import type { $ZodString, $ZodTemplateLiteral } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';
import { regexToMask } from '../utils.js';

/** Map Zod v4 string format names to HTML input types */
const FORMAT_TO_INPUT_TYPE: Record<string, string> = {
  email: 'email',
  url: 'url',
  date: 'date',
  time: 'time',
  datetime: 'datetime-local'
  // Duration has no native input type — falls through to text
};

/** Formats that should render as DatePicker instead of a plain Input */
const DATE_PICKER_FORMATS = new Set(['date', 'time', 'datetime']);

export function processString(
  schema: $ZodString,
  ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const bag = schema._zod.bag;
  const def = schema._zod.def;
  const meta = ctx.formRegistry?.get(schema);

  // Format can come from string format subtypes (def.format) or bag.format
  const format =
    ('format' in def && typeof def.format === 'string' ? def.format : undefined) ??
    (typeof bag['format'] === 'string' ? bag['format'] : undefined);

  const minimum = typeof bag['minimum'] === 'number' ? bag['minimum'] : undefined;
  const maximum = typeof bag['maximum'] === 'number' ? bag['maximum'] : undefined;

  // bag.patterns holds a Set<RegExp> — take the first regex's source
  const patternsSet = bag['patterns'];
  const pattern =
    patternsSet instanceof Set && patternsSet.size > 0
      ? ([...patternsSet][0] as RegExp).source
      : undefined;

  // Determine component and input type from format
  const inputType = format ? (FORMAT_TO_INPUT_TYPE[format] ?? 'text') : 'text';
  const isDateLike = format ? DATE_PICKER_FORMATS.has(format) : false;

  field.component = meta?.component ?? (isDateLike ? 'DatePicker' : 'Input');
  field.props = {
    ...field.props,
    type: inputType
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

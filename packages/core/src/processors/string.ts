import type { ZodType } from 'zod';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

function getDef(schema: ZodType): Record<string, unknown> {
  return (
    (schema as unknown as { _zod?: { def?: Record<string, unknown> } })['_zod']?.['def'] ?? {}
  );
}

function getBag(schema: ZodType): Record<string, unknown> {
  return (
    (schema as unknown as { _zod?: { bag?: Record<string, unknown> } })['_zod']?.['bag'] ?? {}
  );
}

export function processString(
  schema: ZodType,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const bag = getBag(schema);
  const format = typeof bag['format'] === 'string' ? bag['format'] : undefined;
  const minimum = typeof bag['minimum'] === 'number' ? bag['minimum'] : undefined;
  const maximum = typeof bag['maximum'] === 'number' ? bag['maximum'] : undefined;
  const pattern = typeof bag['pattern'] === 'string' ? bag['pattern'] : undefined;

  field.component = 'Input';
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
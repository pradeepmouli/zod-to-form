import type { $ZodType as ZodType } from 'zod/v4/core';
import { processFallback } from './fallback.js';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';
import { getDef } from './_utils.js';

function runInner(
  innerSchema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const innerDef = getDef(innerSchema);
  const innerType = typeof innerDef['type'] === 'string' ? (innerDef['type'] as string) : 'unknown';
  const processor = ctx.processors[innerType];

  field.zodType = innerType;

  if (processor) {
    processor(innerSchema, ctx, field, params);
    return;
  }

  processFallback(innerSchema, ctx, field, params);
}

export function processOptional(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const def = getDef(schema);
  const innerType = def['innerType'] as ZodType | undefined;

  field.required = false;
  if (innerType) {
    runInner(innerType, ctx, field, params);
  }
}

export function processNullable(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const def = getDef(schema);
  const innerType = def['innerType'] as ZodType | undefined;

  field.required = false;
  if (innerType) {
    runInner(innerType, ctx, field, params);
  }
}

export function processDefault(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const def = getDef(schema);
  const innerType = def['innerType'] as ZodType | undefined;
  const defaultValue = def['defaultValue'];

  if (typeof defaultValue === 'function') {
    field.defaultValue = (defaultValue as () => unknown)();
  } else {
    field.defaultValue = defaultValue;
  }

  if (innerType) {
    runInner(innerType, ctx, field, params);
  }
}

export function processReadonly(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const def = getDef(schema);
  const innerType = def['innerType'] as ZodType | undefined;

  field.readOnly = true;
  if (innerType) {
    runInner(innerType, ctx, field, params);
  }
}

export function processPipe(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const def = getDef(schema);
  const inputType = def['in'] as ZodType | undefined;

  if (inputType) {
    runInner(inputType, ctx, field, params);
  }
}

export function processLazy(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  if (ctx.currentDepth >= ctx.maxDepth) {
    field.component = 'Input';
    field.props['type'] = 'text';
    return;
  }

  const def = getDef(schema);
  const getter = def['getter'] as (() => ZodType) | undefined;

  if (!getter) {
    field.component = 'Input';
    field.props['type'] = 'text';
    return;
  }

  const innerSchema = getter();

  if (ctx.seen.has(innerSchema)) {
    field.component = 'Input';
    field.props['type'] = 'text';
    return;
  }

  runInner(innerSchema, { ...ctx, currentDepth: ctx.currentDepth + 1 }, field, params);
}

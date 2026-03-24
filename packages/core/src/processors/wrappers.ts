import type {
  $ZodType as ZodType,
  $ZodOptional,
  $ZodNullable,
  $ZodDefault,
  $ZodPrefault,
  $ZodReadonly,
  $ZodPipe,
  $ZodLazy
} from 'zod/v4/core';
import { processFallback } from './fallback.js';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

function runInner(
  innerSchema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const innerType = innerSchema._zod.def.type;
  const processor = ctx.processors[innerType];

  field.zodType = innerType;

  if (processor) {
    processor(innerSchema, ctx, field, params);
    return;
  }

  processFallback(innerSchema, ctx, field, params);
}

export function processOptional(
  schema: $ZodOptional,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const innerType = schema._zod.def.innerType;

  field.required = false;
  if (innerType) {
    runInner(innerType, ctx, field, params);
  }
}

export function processNullable(
  schema: $ZodNullable,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const innerType = schema._zod.def.innerType;

  field.required = false;
  if (innerType) {
    runInner(innerType, ctx, field, params);
  }
}

export function processDefault(
  schema: $ZodDefault | $ZodPrefault,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const def = schema._zod.def;
  const innerType = def.innerType;
  const defaultValue = def.defaultValue;

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
  schema: $ZodReadonly,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const innerType = schema._zod.def.innerType;

  field.readOnly = true;
  if (innerType) {
    runInner(innerType, ctx, field, params);
  }
}

export function processPipe(
  schema: $ZodPipe,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const inputType = schema._zod.def.in;

  if (inputType) {
    runInner(inputType, ctx, field, params);
  }
}

export function processLazy(
  schema: $ZodLazy,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  if (ctx.currentDepth >= ctx.maxDepth) {
    field.component = 'Input';
    field.props['type'] = 'text';
    return;
  }

  const getter = schema._zod.def.getter;

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

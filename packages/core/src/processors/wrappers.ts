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

/**
 * Process `z.optional()` — unwraps to the inner type and marks the field as not required.
 * Delegates to the inner type's processor for all component and constraint extraction.
 *
 * @param schema - The `$ZodOptional` schema to unwrap.
 * @param ctx - The walker context providing the processor registry for inner type dispatch.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata passed through to the inner processor.
 *
 * @category Processors
 */
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

/**
 * Process `z.nullable()` — unwraps to the inner type and marks the field as not required.
 * Nullable fields accept null in addition to the inner type; the field renders normally.
 *
 * @param schema - The `$ZodNullable` schema to unwrap.
 * @param ctx - The walker context providing the processor registry for inner type dispatch.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata passed through to the inner processor.
 *
 * @category Processors
 */
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

/**
 * Process `z.default()` / `z.prefault()` — extracts the default value and delegates to the inner type.
 * Sets `field.defaultValue` from the schema's default (evaluating functions eagerly).
 *
 * @param schema - The `$ZodDefault` or `$ZodPrefault` schema to unwrap.
 * @param ctx - The walker context providing the processor registry for inner type dispatch.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata passed through to the inner processor.
 *
 * @category Processors
 */
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

/**
 * Process `z.readonly()` — marks the field as read-only and delegates to the inner type.
 * The rendered component receives `readOnly: true` via the base field props.
 *
 * @param schema - The `$ZodReadonly` schema to unwrap.
 * @param ctx - The walker context providing the processor registry for inner type dispatch.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata passed through to the inner processor.
 *
 * @category Processors
 */
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

/**
 * Process `z.pipe()` — unwraps to the input type and delegates to its processor.
 * The output/transform side is handled by the L1 optimizer for submit-time validation.
 *
 * @param schema - The `$ZodPipe` schema whose `in` type drives the rendered field.
 * @param ctx - The walker context providing the processor registry for inner type dispatch.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata passed through to the inner processor.
 *
 * @category Processors
 */
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

/**
 * Process `z.lazy()` — evaluates the lazy getter and delegates to the inner schema's processor.
 * Guards against infinite recursion using `ctx.currentDepth` / `ctx.maxDepth` and the `seen` WeakSet.
 * Renders as a plain text `Input` when the depth limit is reached or the schema is cyclic.
 *
 * @param schema - The `$ZodLazy` schema whose getter is evaluated on first encounter.
 * @param ctx - The walker context providing depth tracking, cycle detection, and processor dispatch.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata passed through to the inner processor.
 *
 * @category Processors
 */
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

import type { $ZodType as ZodType } from 'zod/v4/core';
import { resolveMetadata } from './metadata.js';
import { processFallback } from './processors/fallback.js';
import { createProcessors } from './registry.js';
import { createBaseField } from './utils.js';
import type { FormField, WalkOptions } from './types.js';
import type { FormOptimizerContext, WalkResult } from './optimizers/types.js';
import { createOptimizers } from './optimizers/index.js';
import { createSchemaLiteCollector } from './optimizers/schema-lite.js';

function processField(
  schema: ZodType,
  key: string,
  options: WalkOptions | undefined,
  processors: ReturnType<typeof createProcessors>,
  seen: WeakSet<ZodType>,
  maxDepth: number,
  currentDepth: number,
  optimizerCtx?: FormOptimizerContext
): FormField {
  const zodType = schema._zod.def.type;
  const field = createBaseField(key, zodType);

  if (seen.has(schema) || currentDepth >= maxDepth) {
    field.component = 'Input';
    field.props['type'] = 'text';
    return field;
  }

  seen.add(schema);

  const ctx: import('./types.js').FormProcessorContext = {
    processors,
    formRegistry: options?.formRegistry,
    path: key.split('.'),
    seen,
    maxDepth,
    currentDepth,
    processChild: (childSchema, childKey) =>
      processField(
        childSchema,
        childKey,
        options,
        processors,
        seen,
        maxDepth,
        currentDepth + 1,
        optimizerCtx
      )
  };

  const processor = processors[zodType];
  if (processor) {
    processor(schema, ctx, field, { parentKey: key });
  } else {
    processFallback(schema, ctx, field, { parentKey: key });
  }

  const metadata = resolveMetadata(schema, options?.formRegistry);

  if (metadata.title) {
    field.label = metadata.title;
  }
  if (metadata.description) {
    field.description = metadata.description;
  }
  if (metadata.examples?.[0] && typeof metadata.examples[0] === 'string') {
    field.placeholder = metadata.examples[0];
    if (field.component === 'Input' || field.component === 'Textarea') {
      field.props['placeholder'] = metadata.examples[0];
    }
  }
  if (metadata.props) {
    const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
    for (const [k, v] of Object.entries(metadata.props)) {
      if (!BLOCKED_KEYS.has(k)) {
        field.props[k] = v;
      }
    }
  }
  if (metadata.hidden !== undefined) {
    field.hidden = metadata.hidden;
  }
  if (metadata.order !== undefined) {
    field.order = metadata.order;
  }
  if (metadata.deprecated !== undefined) {
    field.deprecated = metadata.deprecated;
  }
  if (metadata.disabled !== undefined) {
    field.disabled = metadata.disabled;
  }
  if (metadata.helpText !== undefined) {
    field.helpText = metadata.helpText;
  }
  if (typeof metadata.render === 'function') {
    field.render = metadata.render as (field: FormField, props: Record<string, unknown>) => unknown;
    field.hasCustomRender = true;
  }

  // Run optimizer chain after processor + metadata overlay
  if (optimizerCtx) {
    const optimizers = optimizerCtx.optimizers[zodType];
    if (optimizers) {
      for (const optimizer of optimizers) {
        optimizer(schema, optimizerCtx, field, { parentKey: key });
      }
    }
  }

  return field;
}

/**
 * Detect top-level refines/transforms/superRefines on the schema.
 *
 * In Zod v4, `z.object({}).superRefine(fn)` creates a new object schema
 * with the same def.type="object" but with additional checks in def.checks.
 * The parent chain points to the original (check-free) schema.
 *
 * We detect top-level effects by checking if the schema has checks that
 * differ from its parent, indicating superRefine/refine was applied.
 */
function hasTopLevelEffects(schema: ZodType): boolean {
  const def = schema._zod.def as unknown as Record<string, unknown>;
  const checks = def['checks'] as unknown[] | undefined;
  if (!checks || checks.length === 0) return false;

  // If there's a parent, compare check counts
  const parent = schema._zod.parent;
  if (parent) {
    const parentDef = (parent as ZodType)._zod.def as unknown as Record<string, unknown>;
    const parentChecks = parentDef['checks'] as unknown[] | undefined;
    return !parentChecks || checks.length > parentChecks.length;
  }

  return checks.length > 0;
}

/**
 * Walk a Zod schema and produce a FormField[] tree.
 * When optimization option is set, returns WalkResult with fields + schemaLite.
 */
export function walkSchema(
  schema: ZodType,
  options: WalkOptions & { optimization: { level: 1 | 2 | 3 } }
): WalkResult;
export function walkSchema(schema: ZodType, options?: WalkOptions): FormField[];
export function walkSchema(schema: ZodType, options?: WalkOptions): FormField[] | WalkResult {
  // Unwrap top-level effects to get the actual object schema
  let objectSchema = schema;
  const topLevelType = schema._zod.def.type;

  // If the schema is wrapped in pipes/effects, find the underlying object
  if (topLevelType !== 'object') {
    // Try to find the inner object schema for pipe/effect wrappers
    const def = schema._zod.def as unknown as Record<string, unknown>;
    if (topLevelType === 'pipe' && def['in']) {
      objectSchema = def['in'] as ZodType;
    }

    if (objectSchema._zod.def.type !== 'object') {
      throw new Error('walkSchema expects a top-level z.object() schema.');
    }
  }

  const maxDepth = options?.maxDepth ?? 5;
  const processors = createProcessors(options?.processors ?? {});
  const shape = (objectSchema._zod.def as unknown as { shape: Record<string, ZodType> }).shape;

  const isOptimized = options?.optimization?.level !== undefined;

  // Set up optimizer context if optimization is enabled
  let optimizerCtx: FormOptimizerContext | undefined;
  let collector: ReturnType<typeof createSchemaLiteCollector> | undefined;

  if (isOptimized) {
    collector = createSchemaLiteCollector();
    const optimizers = createOptimizers(options!.optimization!.optimizers ?? {});

    optimizerCtx = {
      optimizers,
      schemaLite: collector,
      level: options!.optimization!.level
    };

    // Detect top-level effects (superRefine, refine, transform).
    // Extract the extra checks added beyond the parent (base object) and pass
    // them to the collector. The collector builds a lite schema: z.object({}).loose()
    // with only these checks — no field-level validation (that's per-field).
    if (hasTopLevelEffects(schema)) {
      const def = schema._zod.def as unknown as Record<string, unknown>;
      const checks = def['checks'] as unknown[];
      const parent = schema._zod.parent;
      const parentDef = parent
        ? ((parent as ZodType)._zod.def as unknown as Record<string, unknown>)
        : undefined;
      const parentChecks = (parentDef?.['checks'] as unknown[] | undefined) ?? [];
      const extraChecks = checks.slice(parentChecks.length);
      for (const check of extraChecks) {
        collector.addCheck(check);
      }
    }
  }

  // Each top-level field gets its own `seen` set so that reused schema instances
  // (e.g. `const name = z.string(); z.object({ a: name, b: name })`) are handled
  // correctly across siblings, while still detecting cycles within a single descent.
  const fields = Object.entries(shape).map(([key, childSchema]) => {
    const seen = new WeakSet<ZodType>();
    return processField(childSchema, key, options, processors, seen, maxDepth, 0, optimizerCtx);
  });

  const sorted = fields.sort((left, right) => {
    if (left.order === undefined && right.order === undefined) {
      return 0;
    }
    if (left.order === undefined) {
      return 1;
    }
    if (right.order === undefined) {
      return -1;
    }
    return left.order - right.order;
  });

  if (isOptimized && collector) {
    return {
      fields: sorted,
      schemaLite: collector.build()
    };
  }

  return sorted;
}

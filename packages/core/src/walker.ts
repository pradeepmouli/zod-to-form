import type { $ZodType as ZodType } from 'zod/v4/core';
import { resolveMetadata } from './metadata.js';
import { processFallback } from './processors/fallback.js';
import { createProcessors } from './registry.js';
import { createBaseField } from './utils.js';

/**
 * Zod v4's $ZodTypeDef is a union without an index signature.
 * Bracket access (def['checks']) requires casting to Record<string, unknown>.
 * The double cast (as unknown as) is needed because $ZodTypeDef and
 * Record<string, unknown> don't structurally overlap.
 */
type Def = Record<string, unknown>;

/**
 * Container types that render children rather than validating themselves.
 * Used to detect nested container effects for fallthrough collection.
 * Matches the set excluded from L1 in l1-decompose.ts.
 */
const CONTAINER_TYPES = new Set([
  'object',
  'array',
  'tuple',
  'union',
  'intersection',
  'record',
  'map',
  'set'
]);

import type { FormField, WalkOptions } from './types.js';
import type { FormOptimizerContext, WalkResult, SchemaLiteInfo } from './optimizers/types.js';
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

    // Recursive child collectors: capture effects on nested containers.
    //
    // L1 intentionally excludes containers (object, array, intersection, etc.)
    // from zodSchema — calling safeParse on a container would tree-walk the
    // entire subtree, defeating per-field decomposition.
    //
    // But a container CAN have effects: billing: z.object({...}).superRefine(fn).
    // Without this, the superRefine is silently dropped in the optimized path.
    //
    // We detect container-level effects and add the full schema as a fallthrough
    // field to the collector. The collector materializes dot-paths (e.g.
    // "address.billing") into nested z.object wrappers so the lite schema's
    // structure matches the actual data shape during validation.
    if (CONTAINER_TYPES.has(zodType) && hasTopLevelEffects(schema)) {
      optimizerCtx.schemaLite.addField(key, schema);
    }
  }

  return field;
}

/**
 * Collect top-level effects from the schema and add them to the collector.
 *
 * Handles both check-based effects (superRefine/refine) and pipe/transform wrappers.
 * The collector uses these to build a lite schema for submit-time validation.
 */
function collectTopLevelEffects(
  schema: ZodType,
  objectSchema: ZodType,
  collector: ReturnType<typeof createSchemaLiteCollector>
): SchemaLiteInfo {
  const def = schema._zod.def as unknown as Def;

  // Case 1: pipe/transform wrapper (def.type === 'pipe')
  if (schema !== objectSchema && def['type'] === 'pipe') {
    const out = def['out'] as ZodType | undefined;
    const outDef = out?._zod?.def as Record<string, unknown> | undefined;

    if (outDef?.['type'] === 'transform' && typeof outDef['transform'] === 'function') {
      collector.addTransform(outDef['transform'] as (data: unknown) => unknown);
    } else if (out) {
      collector.setOriginalSchema(schema);
      return { type: 'original', fallthroughFields: [] };
    }

    const pipeChecks = def['checks'] as unknown[] | undefined;
    if (pipeChecks) {
      for (const check of pipeChecks) {
        collector.addCheck(check);
      }
    }

    const hasInnerChecks = hasTopLevelEffects(objectSchema);
    if (hasInnerChecks) {
      extractChecksFromSchema(objectSchema, collector);
    }

    return {
      type: 'transform',
      hasInnerChecks,
      hasOuterChecks: (pipeChecks?.length ?? 0) > 0,
      fallthroughFields: []
    };
  }

  // Case 2: checks on the object schema (superRefine/refine, no pipe wrapper)
  if (hasTopLevelEffects(schema)) {
    const checkCount = extractChecksFromSchema(schema, collector);
    return { type: 'checks', checkCount, fallthroughFields: [] };
  }

  return null;
}

function extractChecksFromSchema(
  schema: ZodType,
  collector: ReturnType<typeof createSchemaLiteCollector>
): number {
  const def = schema._zod.def as unknown as Def;
  const checks = def['checks'] as unknown[] | undefined;
  if (!checks || checks.length === 0) return 0;

  // Walk up to the root parent (base object without effects) to get the
  // original check count. This handles chained effects like
  // .superRefine(fn1).superRefine(fn2) where each link adds one check.
  let root: ZodType = schema;
  while (root._zod.parent) {
    root = root._zod.parent as ZodType;
  }
  const rootDef = root._zod.def as unknown as Def;
  const rootChecks = (rootDef['checks'] as unknown[] | undefined) ?? [];

  const extraChecks = checks.slice(rootChecks.length);
  for (const check of extraChecks) {
    collector.addCheck(check);
  }
  return extraChecks.length;
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
  const def = schema._zod.def as unknown as Def;
  const checks = def['checks'] as unknown[] | undefined;
  if (!checks || checks.length === 0) return false;

  // If there's a parent, compare check counts
  const parent = schema._zod.parent;
  if (parent) {
    const parentDef = (parent as ZodType)._zod.def as unknown as Def;
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
    const def = schema._zod.def as unknown as Def;
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
  let schemaLiteInfo: SchemaLiteInfo = null;

  if (isOptimized) {
    collector = createSchemaLiteCollector();
    const optimizers = createOptimizers(options!.optimization!.optimizers ?? {});

    optimizerCtx = {
      optimizers,
      schemaLite: collector,
      level: options!.optimization!.level
    };

    // Detect and capture top-level effects for schemaLite.
    //
    // Effects come in two forms:
    // 1. Checks (superRefine/refine): stored in def.checks on the schema
    // 2. Pipe/transform: wraps schema in def.type="pipe" with def.out holding the transform
    //
    // We extract both and replay them onto a lite z.object({}).loose() schema
    // so submit-time validation skips field-level checks but preserves effects.
    schemaLiteInfo = collectTopLevelEffects(schema, objectSchema, collector);
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
    // Attach fallthrough field paths to the info for codegen.
    // If only nested containers contributed effects (no top-level effects),
    // reuse the 'checks' variant with checkCount: 0. The existing codegen
    // for 'checks' creates z.object({...fallthrough}).loose() and replays
    // checks — with 0 checks, only the fallthrough fields provide validation.
    const fallthroughFields = [...collector.fields.keys()];
    if (schemaLiteInfo) {
      schemaLiteInfo.fallthroughFields = fallthroughFields;
    } else if (fallthroughFields.length > 0) {
      schemaLiteInfo = { type: 'checks', checkCount: 0, fallthroughFields };
    }

    return {
      fields: sorted,
      schemaLite: collector.build(),
      schemaLiteInfo
    };
  }

  return sorted;
}

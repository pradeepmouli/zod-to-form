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

import type { FormField, WalkOptions } from './types.js';
import type { FormOptimizerContext, WalkResult, SchemaLiteInfo } from './optimizers/types.js';
import { createOptimizers } from './optimizers/index.js';
import {
  CONTAINER_TYPES,
  collectContainerEffects,
  createSchemaLiteCollector,
  hasTopLevelEffects,
  isPipeWrappedContainer
} from './optimizers/schema-lite.js';

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

  // ── Detect container effects BEFORE processing children ──────────
  //
  // When a container has effects (superRefine/refine/transform), we create
  // a child SchemaLiteCollector and swap it into the optimizerCtx so that
  // children are processed into this collector. After children are done,
  // we build() the child collector and add the result to the parent.
  //
  // This inside-out construction means each level only contains its own
  // effects plus built results from nested containers — no redundant
  // child validation, no separate pruning step.
  //
  // Keys with numeric segments (e.g. "items.0") are array/tuple element
  // template paths, not real object properties. Skip them — the collector
  // would materialize them as z.object wrappers, producing the wrong shape.
  let childCollector: ReturnType<typeof createSchemaLiteCollector> | undefined;
  let childOptimizerCtx = optimizerCtx;

  if (optimizerCtx) {
    const hasArrayIndexSegment = key.split('.').some((segment) => /^\d+$/.test(segment));
    const containerWithEffects =
      !hasArrayIndexSegment &&
      ((CONTAINER_TYPES.has(zodType) && hasTopLevelEffects(schema)) ||
        (zodType === 'pipe' && isPipeWrappedContainer(schema)));

    if (containerWithEffects) {
      // Object containers (and pipes wrapping objects) use z.object({}).loose()
      // as the base; all others (array, tuple, etc.) use z.any().
      const resolvedType =
        zodType === 'pipe'
          ? (((schema._zod.def as unknown as Def)['in'] as ZodType)?._zod?.def?.type ?? zodType)
          : zodType;
      childCollector = createSchemaLiteCollector({
        useAnyBase: resolvedType !== 'object'
      });
      collectContainerEffects(schema, childCollector);
      childOptimizerCtx = {
        ...optimizerCtx,
        schemaLite: childCollector,
        collectorBasePath: key
      };
    }
  }

  // ── Process field (children use child collector if applicable) ────
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
        childOptimizerCtx
      )
  };

  const processor = processors[zodType];
  if (processor) {
    processor(schema, ctx, field, { parentKey: key });
  } else {
    processFallback(schema, ctx, field, { parentKey: key });
  }

  // ── Apply metadata ───────────────────────────────────────────────
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

  // ── Run optimizer chain (uses ORIGINAL ctx, not child) ───────────
  if (optimizerCtx) {
    const optimizers = optimizerCtx.optimizers[zodType];
    if (optimizers) {
      for (const optimizer of optimizers) {
        optimizer(schema, optimizerCtx, field, { parentKey: key });
      }
    }
  }

  // ── Build child collector and add to parent ──────────────────────
  if (childCollector && optimizerCtx) {
    const built = childCollector.build();
    if (built) {
      const basePath = optimizerCtx.collectorBasePath;
      const relativePath = basePath ? key.slice(basePath.length + 1) : key;
      optimizerCtx.schemaLite.addField(relativePath, built);
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
 * Walk a Zod schema and produce a FormField[] tree.
 * When optimization option is set, returns WalkResult with fields + schemaLite.
 *
 * @remarks
 * Recursively walks a Zod schema tree and produces a FormField[] intermediate
 * representation. Dispatches by def.type to a processor registry. Each processor
 * extracts structure and constraints from _zod.def + _zod.bag.
 * Uses WeakSet per top-level field for cycle detection — reused schema instances
 * (e.g., z.string() in two fields) don't trigger false positives.
 * The walker is STATELESS — call it repeatedly with different formRegistry values.
 *
 * @useWhen
 * - You need direct schema-to-fields conversion in runtime contexts
 * - You're building a custom codegen pipeline on top of FormField[]
 *
 * @avoidWhen
 * - You just want generated components — use the CLI instead
 * - Your schema is not z.object() at the root level
 *
 * @pitfalls
 * - NEVER pass a non-object schema at the root — throws immediately
 * - NEVER bypass the processor registry for custom types — extend via options.processors
 * - NEVER skip normalizeFormValues() before schema.safeParse() — empty strings from HTML inputs fail optional field validation
 *
 * @param schema - The Zod schema to walk. Must be a `z.object()` (or pipe-wrapped object) at the root.
 * @param options - Optional walk options including formRegistry, custom processors, maxDepth, and optimization config.
 * @returns A sorted `FormField[]` array, or a `WalkResult` with `fields` + `schemaLite` when optimization is requested.
 *
 * @category Schema Walking
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
      level: options!.optimization!.level,
      collectorBasePath: ''
    };

    // Detect and capture top-level effects for schemaLite.
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

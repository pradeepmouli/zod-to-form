import { z } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import type { SchemaLiteCollector } from './types.js';

/**
 * Zod v4's fluent methods return different TS types but all implement
 * $ZodType at runtime. We use this interface to chain without fighting types.
 */
interface Chainable {
  check(c: unknown): Chainable;
  transform(fn: (data: unknown) => unknown): Chainable;
}

// ─── Container Detection ────────────────────────────────────────────

/**
 * Container types that render children rather than validating themselves.
 * Used to detect nested container effects for fallthrough collection.
 * Matches the set excluded from L1 in l1-decompose.ts.
 */
export const CONTAINER_TYPES = new Set([
  'object',
  'array',
  'tuple',
  'union',
  'intersection',
  'record',
  'map',
  'set'
]);

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
export function hasTopLevelEffects(schema: $ZodType): boolean {
  const def = schema._zod.def as unknown as Record<string, unknown>;
  const checks = def['checks'] as unknown[] | undefined;
  if (!checks || checks.length === 0) return false;

  const parent = schema._zod.parent;
  if (parent) {
    const parentDef = (parent as $ZodType)._zod.def as unknown as Record<string, unknown>;
    const parentChecks = parentDef['checks'] as unknown[] | undefined;
    return !parentChecks || checks.length > parentChecks.length;
  }

  return checks.length > 0;
}

/**
 * Detect if a schema is a pipe whose input is a container type.
 * e.g. z.object({...}).transform(fn) produces a pipe where def.in is an object.
 */
export function isPipeWrappedContainer(schema: $ZodType): boolean {
  const def = schema._zod.def as unknown as Record<string, unknown>;
  if (def['type'] !== 'pipe') return false;
  const innerDef = (def['in'] as $ZodType | undefined)?._zod?.def as unknown as
    | Record<string, unknown>
    | undefined;
  return innerDef ? CONTAINER_TYPES.has(innerDef['type'] as string) : false;
}

// ─── Effect Collection ──────────────────────────────────────────────

/**
 * Extract extra checks (superRefine/refine) beyond the root schema's
 * own checks and add them to a collector.
 */
function addExtraChecks(schema: $ZodType, collector: SchemaLiteCollector): void {
  if (!schema._zod.parent) return;

  let root: $ZodType = schema;
  while (root._zod.parent) {
    root = root._zod.parent as $ZodType;
  }

  const def = schema._zod.def as unknown as Record<string, unknown>;
  const rootDef = root._zod.def as unknown as Record<string, unknown>;
  const checks = (def['checks'] as unknown[]) ?? [];
  const rootChecks = (rootDef['checks'] as unknown[]) ?? [];

  for (const check of checks.slice(rootChecks.length)) {
    collector.addCheck(check);
  }
}

/**
 * Collect effects (checks/transforms) from a container schema into a collector.
 *
 * The walker calls this when it detects a container with effects, BEFORE
 * processing the container's children. Children are then processed with
 * this collector (via swapped optimizerCtx), so nested containers with
 * effects recursively create their own child collectors and add their
 * built results as fields. The collector's build() produces the final
 * pruned schema — an inside-out construction.
 *
 * Handles two forms:
 * - Direct container (superRefine/refine): extracts extra checks
 * - Pipe-wrapped container (transform ± checks): extracts inner checks,
 *   transform function, and pipe-level checks
 */
export function collectContainerEffects(schema: $ZodType, collector: SchemaLiteCollector): void {
  const def = schema._zod.def as unknown as Record<string, unknown>;
  const schemaType = def['type'] as string;

  if (schemaType === 'pipe') {
    const innerSchema = def['in'] as $ZodType;
    const outSchema = def['out'] as $ZodType;
    const outDef = outSchema._zod.def as unknown as Record<string, unknown>;

    // Inner container effects (superRefine before transform)
    addExtraChecks(innerSchema, collector);

    // Transform
    if (outDef['type'] === 'transform' && typeof outDef['transform'] === 'function') {
      collector.addTransform(outDef['transform'] as (data: unknown) => unknown);
    }

    // Pipe-level checks (superRefine after transform)
    const pipeChecks = def['checks'] as unknown[] | undefined;
    if (pipeChecks && pipeChecks.length > 0) {
      for (const check of pipeChecks) {
        collector.addCheck(check);
      }
    }

    return;
  }

  // Direct container with effects
  addExtraChecks(schema, collector);
}

// ─── Field Map Materialization ──────────────────────────────────────

/**
 * Recursively materialize a map of dot-paths into a nested object shape,
 * merging all paths that share the same top-level key.
 *
 * For example, given { "address.billing": billingSchema, "address.shipping": shippingSchema }:
 *   → { address: z.object({ billing: billingSchema, shipping: shippingSchema }).loose() }
 */
function materializeFieldMap(fieldMap: ReadonlyMap<string, $ZodType>): Record<string, $ZodType> {
  const topShape: Record<string, $ZodType> = {};
  const nestedGroups = new Map<string, Map<string, $ZodType>>();

  for (const [path, schema] of fieldMap) {
    const dotIndex = path.indexOf('.');
    if (dotIndex === -1) {
      topShape[path] = schema;
    } else {
      const topKey = path.slice(0, dotIndex);
      const rest = path.slice(dotIndex + 1);
      let group = nestedGroups.get(topKey);
      if (!group) {
        group = new Map();
        nestedGroups.set(topKey, group);
      }
      group.set(rest, schema);
    }
  }

  for (const [topKey, subMap] of nestedGroups) {
    const nestedShape = materializeFieldMap(subMap);
    topShape[topKey] = z.object(nestedShape).loose() as unknown as $ZodType;
  }

  return topShape;
}

// ─── SchemaLite Collector ───────────────────────────────────────────

/**
 * Create a new SchemaLiteCollector instance.
 *
 * Builds a "lite" schema for submit-time validation:
 * - Checks (superRefine/refine): z.object({}).loose().check(c1).check(c2)
 * - Transforms: z.object({}).loose().check(...).transform(fn)
 * - Non-decomposable pipes: original schema as-is
 */
export function createSchemaLiteCollector(options?: {
  /** Use z.any() instead of z.object({}).loose() when no fields are present.
   *  Set for non-object containers (arrays, tuples, etc.) whose data isn't an object. */
  useAnyBase?: boolean;
}): SchemaLiteCollector {
  const useAnyBase = options?.useAnyBase ?? false;
  const collectedChecks: unknown[] = [];
  const collectedTransforms: Array<(data: unknown) => unknown> = [];
  const fieldMap = new Map<string, $ZodType>();
  let originalSchema: $ZodType | null = null;

  return {
    addCheck(check: unknown): void {
      collectedChecks.push(check);
    },

    addTransform(fn: (data: unknown) => unknown): void {
      collectedTransforms.push(fn);
    },

    addField(path: string, schema: $ZodType): void {
      fieldMap.set(path, schema);
    },

    setOriginalSchema(schema: $ZodType): void {
      originalSchema = schema;
    },

    isEmpty(): boolean {
      return (
        collectedChecks.length === 0 &&
        collectedTransforms.length === 0 &&
        fieldMap.size === 0 &&
        originalSchema === null
      );
    },

    build(): $ZodType | null {
      if (
        collectedChecks.length === 0 &&
        collectedTransforms.length === 0 &&
        fieldMap.size === 0 &&
        !originalSchema
      ) {
        return null;
      }

      // Non-decomposable pipe — use original schema as-is
      if (originalSchema) {
        return originalSchema;
      }

      // Build lite schema from collected effects.
      //
      // Dot-paths (e.g. "address.billing") are materialized into nested
      // z.object({ billing: schema }).loose() wrappers so the lite schema's
      // structure matches the actual data shape during validation.
      //
      // Paths sharing the same topKey (e.g. "address.billing" and
      // "address.shipping") are merged into a single z.object shape rather
      // than overwriting each other.
      const shape = materializeFieldMap(fieldMap);

      let result: Chainable;
      if (Object.keys(shape).length > 0) {
        result = z.object(shape).loose() as unknown as Chainable;
      } else if (useAnyBase) {
        result = z.any() as unknown as Chainable;
      } else {
        result = z.object({}).loose() as unknown as Chainable;
      }

      // Replay checks (superRefine/refine)
      for (const check of collectedChecks) {
        result = result.check(check);
      }

      // Replay transforms
      for (const fn of collectedTransforms) {
        result = result.transform(fn);
      }

      return result as unknown as $ZodType;
    },

    get checks(): ReadonlyArray<unknown> {
      return collectedChecks;
    },

    get fields(): ReadonlyMap<string, $ZodType> {
      return fieldMap;
    }
  };
}

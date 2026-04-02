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

/**
 * Create a new SchemaLiteCollector instance.
 *
 * Builds a "lite" schema for submit-time validation:
 * - Checks (superRefine/refine): z.object({}).loose().check(c1).check(c2)
 * - Transforms: z.object({}).loose().check(...).transform(fn)
 * - Non-decomposable pipes: original schema as-is
 */
export function createSchemaLiteCollector(): SchemaLiteCollector {
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
      const shape: Record<string, $ZodType> = {};
      for (const [path, schema] of fieldMap) {
        if (!path.includes('.')) {
          shape[path] = schema;
          continue;
        }
        const segments = path.split('.');
        const topKey = segments[0]!;
        // Wrap from inside out: z.object({ innermost: schema }).loose()
        let wrapped: $ZodType = schema;
        for (let i = segments.length - 1; i >= 1; i--) {
          const key = segments[i]!;
          wrapped = z.object({ [key]: wrapped }).loose() as unknown as $ZodType;
        }
        shape[topKey] = wrapped;
      }

      let result: Chainable =
        Object.keys(shape).length > 0
          ? (z.object(shape).loose() as unknown as Chainable)
          : (z.object({}).loose() as unknown as Chainable);

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

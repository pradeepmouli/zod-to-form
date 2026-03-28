import { z } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import type { SchemaLiteCollector } from './types.js';

/**
 * Create a new SchemaLiteCollector instance.
 *
 * Builds a "lite" schema for submit-time validation: z.object({}).loose()
 * with only the top-level effect checks (superRefine/refine/transform)
 * chained on. This skips field-level validation (handled per-field)
 * while preserving cross-field and form-level validation.
 */
export function createSchemaLiteCollector(): SchemaLiteCollector {
  const collectedChecks: unknown[] = [];
  const fieldMap = new Map<string, $ZodType>();

  return {
    addCheck(check: unknown): void {
      collectedChecks.push(check);
    },

    addField(path: string, schema: $ZodType): void {
      fieldMap.set(path, schema);
    },

    isEmpty(): boolean {
      return collectedChecks.length === 0 && fieldMap.size === 0;
    },

    build(): $ZodType | null {
      if (collectedChecks.length === 0 && fieldMap.size === 0) {
        return null;
      }

      // Build the shape from fallthrough fields (safety-net fields that
      // couldn't be inlined). Most schemas won't have any.
      const shape: Record<string, $ZodType> = {};
      for (const [path, schema] of fieldMap) {
        shape[path] = schema;
      }

      // Start with a loose object — allows extra keys to pass through
      // since per-field validators handle field-level validation.
      let result: $ZodType =
        Object.keys(shape).length > 0
          ? (z.object(shape).loose() as unknown as $ZodType)
          : (z.object({}).loose() as unknown as $ZodType);

      // Attach the extracted check objects from the original schema.
      // Zod v4's .check() method attaches a raw check to a schema,
      // preserving the exact superRefine/refine/transform behavior
      // without needing to extract or reconstruct the callback function.
      for (const check of collectedChecks) {
        result = (result as unknown as { check(c: unknown): $ZodType }).check(check);
      }

      return result;
    },

    get checks(): ReadonlyArray<unknown> {
      return collectedChecks;
    },

    get fields(): ReadonlyMap<string, $ZodType> {
      return fieldMap;
    }
  };
}

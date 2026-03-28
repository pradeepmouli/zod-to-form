import { z } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import type { SchemaLiteCollector } from './types.js';

/**
 * Create a new SchemaLiteCollector instance.
 *
 * Builds a "lite" schema for submit-time validation:
 * - For superRefine/refine: z.object({}).loose() + extracted checks
 * - For transform/pipe: the original schema (can't decompose transforms)
 */
export function createSchemaLiteCollector(): SchemaLiteCollector {
  const collectedChecks: unknown[] = [];
  const fieldMap = new Map<string, $ZodType>();
  let originalSchema: $ZodType | null = null;

  return {
    addCheck(check: unknown): void {
      collectedChecks.push(check);
    },

    addField(path: string, schema: $ZodType): void {
      fieldMap.set(path, schema);
    },

    setOriginalSchema(schema: $ZodType): void {
      originalSchema = schema;
    },

    isEmpty(): boolean {
      return collectedChecks.length === 0 && fieldMap.size === 0 && originalSchema === null;
    },

    build(): $ZodType | null {
      if (collectedChecks.length === 0 && fieldMap.size === 0 && !originalSchema) {
        return null;
      }

      // When the schema has a pipe/transform wrapper, the output shape changes
      // and we can't decompose it into a lite schema. Use the original.
      if (originalSchema) {
        return originalSchema;
      }

      // Build lite schema: z.object({...fallthrough}).loose() + extracted checks
      const shape: Record<string, $ZodType> = {};
      for (const [path, schema] of fieldMap) {
        shape[path] = schema;
      }

      let result: $ZodType =
        Object.keys(shape).length > 0
          ? (z.object(shape).loose() as unknown as $ZodType)
          : (z.object({}).loose() as unknown as $ZodType);

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

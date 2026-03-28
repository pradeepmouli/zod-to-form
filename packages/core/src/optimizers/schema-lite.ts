import { z } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import type { SchemaLiteCollector, SchemaLiteEntry } from './types.js';

/**
 * Create a new SchemaLiteCollector instance.
 * Accumulates un-inlineable validations during the walk and
 * builds the final schemaLite or returns null if empty.
 */
export function createSchemaLiteCollector(): SchemaLiteCollector {
  const topLevelEntries: SchemaLiteEntry[] = [];
  const fieldMap = new Map<string, $ZodType>();
  let originalSchema: $ZodType | null = null;

  return {
    addTopLevel(entry: SchemaLiteEntry): void {
      topLevelEntries.push(entry);
    },

    removeTopLevel(entry: SchemaLiteEntry): void {
      const idx = topLevelEntries.indexOf(entry);
      if (idx !== -1) {
        topLevelEntries.splice(idx, 1);
      }
    },

    addField(path: string, schema: $ZodType): void {
      fieldMap.set(path, schema);
    },

    isEmpty(): boolean {
      return topLevelEntries.length === 0 && fieldMap.size === 0 && originalSchema === null;
    },

    build(): $ZodType | null {
      if (topLevelEntries.length === 0 && fieldMap.size === 0 && !originalSchema) {
        return null;
      }

      // When the walker stored the original schema (has top-level superRefine/refine),
      // use it directly for submit-time validation. The original schema already
      // validates all fields + top-level effects, so fieldMap entries (safety-net
      // fallthrough fields) are covered by it.
      if (originalSchema) {
        return originalSchema;
      }

      // No original schema — build from collected fields + entries.
      const shape: Record<string, $ZodType> = {};
      for (const [path, schema] of fieldMap) {
        shape[path] = schema;
      }

      // Zod's .loose() allows unknown keys to pass through — critical because
      // schemaLite validates a subset of form data. Zod v4's fluent API returns
      // new schema instances whose internal types don't unify with $ZodType,
      // requiring the result variable to be untyped.
      // SAFETY: z.object().loose().superRefine/refine/transform return valid $ZodType at runtime
      let result: ReturnType<ReturnType<typeof z.object>['loose']> =
        Object.keys(shape).length > 0 ? z.object(shape).loose() : z.object({}).loose();

      for (const entry of topLevelEntries) {
        if (entry.type === 'superRefine') {
          // SAFETY: entry.fn is the superRefine callback stored as unknown — Zod accepts any function here
          result = (result as any).superRefine(entry.fn) as typeof result;
        } else if (entry.type === 'refine') {
          result = (result as any).refine(entry.fn) as typeof result;
        } else if (entry.type === 'transform') {
          result = (result as any).transform(entry.fn) as typeof result;
        }
      }

      return result as $ZodType;
    },

    setOriginalSchema(schema: $ZodType): void {
      originalSchema = schema;
    },

    get topLevel(): ReadonlyArray<SchemaLiteEntry> {
      return topLevelEntries;
    },

    get fields(): ReadonlyMap<string, $ZodType> {
      return fieldMap;
    }
  };
}

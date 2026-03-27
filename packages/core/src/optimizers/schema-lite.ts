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

      // If we have the original schema with effects, use it directly.
      // This preserves the exact superRefine/refine behavior.
      if (originalSchema && fieldMap.size === 0 && topLevelEntries.length === 0) {
        return originalSchema;
      }

      // Build the object shape from collected fields
      const shape: Record<string, $ZodType> = {};
      for (const [path, schema] of fieldMap) {
        shape[path] = schema;
      }

      // Start with a loose object (allows unknown keys to pass through)
      let result: any =
        Object.keys(shape).length > 0 ? z.object(shape).loose() : z.object({}).loose();

      // Chain top-level entries (function-based superRefines)
      for (const entry of topLevelEntries) {
        if (entry.type === 'superRefine') {
          result = result.superRefine(entry.fn as any);
        } else if (entry.type === 'refine') {
          result = result.refine(entry.fn as any);
        } else if (entry.type === 'transform') {
          result = result.transform(entry.fn as any);
        }
      }

      return result as $ZodType;
    },

    /**
     * Set the original schema with top-level effects.
     * Used when the schema has superRefine/refine that can't be extracted as functions.
     */
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

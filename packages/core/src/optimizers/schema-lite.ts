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

      // When the walker stored the original schema (has top-level superRefine/refine/transform),
      // use it directly for submit-time validation. The original schema already validates
      // all fields + top-level effects, so fieldMap entries are covered by it.
      if (originalSchema) {
        return originalSchema;
      }

      // No original schema — this path is used when individual fields couldn't be inlined
      // (safety-net fallthrough) but no top-level effects exist.
      // Future L3 optimizer may also use addTopLevel to reconstruct effects,
      // but that requires operating on ZodPipe for transforms — deferred until L3.
      if (fieldMap.size > 0) {
        // Return the original schema if we have one, otherwise this is a partial
        // validation case that shouldn't happen in practice (fields without effects
        // should be handled by per-field validators, not schemaLite).
        return null;
      }

      return null;
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

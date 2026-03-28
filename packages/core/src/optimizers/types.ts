import type { $ZodType } from 'zod/v4/core';
import type { FormField, ProcessParams, NativeRules, ValidationStrategy } from '../types.js';

// Re-export from types.ts (canonical location, avoids circular deps)
export type { NativeRules, ValidationStrategy };

// ─── Walk Result ─────────────────────────────────────────────────────

export interface WalkResult {
  fields: FormField[];
  schemaLite: $ZodType | null;
}

// ─── Optimizer Types ─────────────────────────────────────────────────

export interface FormOptimizerContext {
  optimizers: Record<string, FormOptimizer[]>;
  schemaLite: SchemaLiteCollector;
  level: 1 | 2 | 3;
}

export type FormOptimizer<T extends $ZodType = $ZodType> = (
  schema: T,
  ctx: FormOptimizerContext,
  field: FormField,
  params: ProcessParams
) => void;

// ─── SchemaLite Collector ────────────────────────────────────────────

export interface SchemaLiteEntry {
  type: 'refine' | 'transform' | 'superRefine';
  fn: unknown;
}

export interface SchemaLiteCollector {
  /** Add a top-level refine/transform/superRefine from the original schema */
  addTopLevel(entry: SchemaLiteEntry): void;
  /** Remove a top-level entry (used by L3 when converting superRefines) */
  removeTopLevel(entry: SchemaLiteEntry): void;
  /** Add a field that couldn't be inlined (safety net fallback) */
  addField(path: string, schema: $ZodType): void;
  /** Set the original schema with top-level effects for submit-time use */
  setOriginalSchema(schema: $ZodType): void;
  /** True when nothing has been collected */
  isEmpty(): boolean;
  /** Build the final schemaLite or return null if empty */
  build(): $ZodType | null;
  /** Read-only access to collected top-level entries */
  readonly topLevel: ReadonlyArray<SchemaLiteEntry>;
  /** Read-only access to collected fallthrough fields */
  readonly fields: ReadonlyMap<string, $ZodType>;
}

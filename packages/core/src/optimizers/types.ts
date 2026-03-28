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

export interface SchemaLiteCollector {
  /** Add a raw Zod check object extracted from the schema's checks array */
  addCheck(check: unknown): void;
  /** Add a field that couldn't be inlined (safety net fallback) */
  addField(path: string, schema: $ZodType): void;
  /** True when nothing has been collected */
  isEmpty(): boolean;
  /** Build the lite schema: z.object({}).loose() + collected checks */
  build(): $ZodType | null;
  /** Read-only access to collected checks */
  readonly checks: ReadonlyArray<unknown>;
  /** Read-only access to collected fallthrough fields */
  readonly fields: ReadonlyMap<string, $ZodType>;
}

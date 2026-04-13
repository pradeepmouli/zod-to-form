import type { $ZodType } from 'zod/v4/core';
import type { FormField, ProcessParams, NativeRules, ValidationStrategy } from '../types.js';

// Re-export from types.ts (canonical location, avoids circular deps)
export type { NativeRules, ValidationStrategy };

// ─── Walk Result ─────────────────────────────────────────────────────

/** Base properties shared by all non-null SchemaLiteInfo variants */
interface SchemaLiteInfoBase {
  /** Fields that could not be inlined and remain in the lite schema */
  fallthroughFields: string[];
}

/** Metadata for codegen to reconstruct the lite schema in a generated file */
export type SchemaLiteInfo =
  | (SchemaLiteInfoBase & { type: 'checks'; checkCount: number })
  | (SchemaLiteInfoBase & {
      type: 'transform';
      hasInnerChecks: boolean;
      hasOuterChecks: boolean;
    })
  | (SchemaLiteInfoBase & { type: 'original' })
  | null;

export interface WalkResult {
  fields: FormField[];
  schemaLite: $ZodType | null;
  /** Codegen metadata — describes how to reconstruct schemaLite in generated code */
  schemaLiteInfo: SchemaLiteInfo;
}

// ─── Optimizer Types ─────────────────────────────────────────────────

export interface FormOptimizerContext {
  optimizers: Record<string, FormOptimizer[]>;
  schemaLite: SchemaLiteCollector;
  level: 1 | 2 | 3;
  /** Dot-path prefix of the current collector's scope (empty string at root) */
  collectorBasePath: string;
}

export type FormOptimizer<T extends $ZodType = $ZodType> = (
  schema: T,
  ctx: FormOptimizerContext,
  field: FormField,
  params: ProcessParams
) => void;

// ─── SchemaLite Collector ────────────────────────────────────────────

export interface SchemaLiteCollector {
  /** Add a raw Zod check object (superRefine/refine) */
  addCheck(check: unknown): void;
  /** Add a transform function extracted from a pipe wrapper */
  addTransform(fn: (data: unknown) => unknown): void;
  /** Add a field that couldn't be inlined (safety net fallback) */
  addField(path: string, schema: $ZodType): void;
  /** Store the original schema when it can't be decomposed (non-transform pipes) */
  setOriginalSchema(schema: $ZodType): void;
  /** True when nothing has been collected */
  isEmpty(): boolean;
  /** Build the lite schema: z.object({}).loose() + checks + transforms */
  build(): $ZodType | null;
  /** Read-only access to collected checks */
  readonly checks: ReadonlyArray<unknown>;
  /** Read-only access to collected fallthrough fields */
  readonly fields: ReadonlyMap<string, $ZodType>;
}

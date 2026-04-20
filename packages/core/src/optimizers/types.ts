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

/**
 * The result returned by `walkSchema()` when an optimization level is specified.
 * Contains the full `FormField[]` tree plus a lite Zod schema for submit-time validation
 * and metadata that codegen uses to reconstruct the lite schema in generated files.
 *
 * @category Schema Walking
 */
export interface WalkResult {
  /** Ordered, sorted FormField tree produced by the schema walker */
  fields: FormField[];
  /** Lite schema for submit-time validation (null when no effects were found) */
  schemaLite: $ZodType | null;
  /** Codegen metadata — describes how to reconstruct schemaLite in generated code */
  schemaLiteInfo: SchemaLiteInfo;
}

// ─── Optimizer Types ─────────────────────────────────────────────────

/**
 * Context shared across all optimizers during a `walkSchema` run.
 * Carries the optimizer registry, the SchemaLite collector, the optimization level,
 * and the current collector's base path for building nested lite schemas.
 *
 * @category Optimization
 */
export interface FormOptimizerContext {
  /** The registered optimizer chains, keyed by Zod def.type */
  optimizers: Record<string, FormOptimizer[]>;
  /** Mutable collector that accumulates checks and fallthrough fields for the lite schema */
  schemaLite: SchemaLiteCollector;
  /** Optimization level: 1 = decompose per-field, 2 = native rules, 3 = cross-field */
  level: 1 | 2 | 3;
  /** Dot-path prefix of the current collector's scope (empty string at root) */
  collectorBasePath: string;
}

/**
 * An optimizer function that mutates a `FormField` after the processor has run.
 * Receives the same schema, context, field, and params as a processor.
 * Used to attach validation metadata (`field.validation`, `field.zodSchema`) and
 * to register lite-schema fragments for submit-time validation.
 *
 * @category Optimization
 */
export type FormOptimizer<T extends $ZodType = $ZodType> = (
  schema: T,
  ctx: FormOptimizerContext,
  field: FormField,
  params: ProcessParams
) => void;

// ─── SchemaLite Collector ────────────────────────────────────────────

/**
 * Mutable accumulator that builds a lite Zod schema for submit-time validation.
 * Collects checks (from `superRefine`/`refine`), transforms (from `pipe`/`transform`),
 * and fallthrough field schemas (for fields that cannot be inlined).
 * Call `build()` at the end of a walker traversal to get the final lite schema.
 *
 * @category Optimization
 */
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

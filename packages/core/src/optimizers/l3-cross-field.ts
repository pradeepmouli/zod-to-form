import type { $ZodType } from 'zod/v4/core';
import type { FormOptimizer, FormOptimizerContext } from './types.js';
import type { FormField, ProcessParams } from '../types.js';

/**
 * Analyzed superRefine pattern — a static cross-field validation
 * that can be converted to watch + validate for real-time feedback.
 */
interface AnalyzedSuperRefine {
  /** The field that receives the error (from ctx.addIssue path) */
  targetPath: string;
  /** Fields that the superRefine reads (from data.X references) */
  watchFields: string[];
  /** The original superRefine entry from SchemaLiteCollector */
  entry: { type: string; fn: unknown };
}

/**
 * Level 3 optimizer: Converts analyzable cross-field superRefines
 * to real-time watch + validate patterns.
 *
 * Static analysis scope (conservative):
 * - Top-level superRefine with ctx.addIssue({ path: ['literal'] })
 * - Function body references data.fieldA and data.fieldB
 * - Only converts patterns we can prove correct; everything else stays in schemaLite
 *
 * This optimizer doesn't run on individual fields like L1/L2 — it operates
 * on the schemaLite collector after all fields have been processed.
 * Instead, it's invoked by the walker post-pass.
 */

/**
 * Analyze the schemaLite for convertible superRefine patterns.
 * Returns analyzed patterns that can be converted to watch+validate.
 *
 * NOTE: In Zod v4, superRefine is baked into the schema's checks
 * and the function isn't easily extractable. This L3 optimizer works
 * with the originalSchema reference stored by the walker.
 * For full L3 support, the superRefine function would need to be
 * extractable from Zod internals — this is a known limitation.
 *
 * For now, L3 provides the infrastructure and type definitions.
 * Full static analysis of superRefine function bodies would require
 * either AST parsing or Zod v4 API changes to expose the function.
 */
export function analyzeSchemaLite(
  _collector: FormOptimizerContext['schemaLite']
): AnalyzedSuperRefine[] {
  // L3 static analysis placeholder.
  // The collector's topLevel entries contain SchemaLiteEntry objects,
  // but in practice the walker stores the original schema reference
  // (via setOriginalSchema) rather than individual function references.
  //
  // Full implementation would:
  // 1. Extract superRefine functions from topLevel entries
  // 2. Parse function.toString() for static patterns
  // 3. Identify ctx.addIssue({ path: ['literal'] }) calls
  // 4. Extract data.fieldA references as watchFields
  // 5. Return analyzed patterns
  //
  // This is intentionally conservative per spec:
  // "Everything else stays in schemaLite (safe fallback)"
  return [];
}

/**
 * L3 optimizer for individual fields — sets watch mode when
 * a field is identified as a cross-field validation target.
 */
const l3Optimizer: FormOptimizer = (
  _schema: $ZodType,
  ctx: FormOptimizerContext,
  _field: FormField,
  _params: ProcessParams
) => {
  // L3 only runs at level 3
  if (ctx.level < 3) return;

  // L3 field-level optimization is handled by the post-pass
  // (analyzeSchemaLite + applyL3Results) rather than per-field.
  // This optimizer is a no-op placeholder for the chain.
};

/**
 * Apply L3 analysis results to fields.
 * Called by the walker after all fields have been processed.
 */
export function applyL3Results(
  fields: FormField[],
  results: AnalyzedSuperRefine[],
  collector: FormOptimizerContext['schemaLite']
): void {
  for (const result of results) {
    const targetField = fields.find((f) => f.key === result.targetPath);
    if (!targetField) continue;

    targetField.validation = {
      mode: 'watch',
      watchFields: result.watchFields,
      watchValidate: undefined // Would be populated with the extracted validate function
    };
    targetField.zodSchema = undefined;

    // Remove the converted superRefine from the collector
    collector.removeTopLevel(result.entry as any);
  }
}

/**
 * Build the L3 optimizer registry.
 * L3 uses a post-pass pattern rather than per-field optimization,
 * but we register a no-op optimizer to maintain the chain structure.
 */
export function buildL3Optimizers(): Record<string, FormOptimizer[]> {
  // L3 doesn't need per-type optimizers since it operates on schemaLite
  // Return empty — the walker's post-pass handles L3
  return {};
}

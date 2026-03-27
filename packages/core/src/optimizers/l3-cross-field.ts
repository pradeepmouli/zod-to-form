import type { FormOptimizerContext } from './types.js';
import type { FormField } from '../types.js';

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
 * Analyze the schemaLite for convertible superRefine patterns.
 * Returns analyzed patterns that can be converted to watch+validate.
 *
 * NOTE: In Zod v4, superRefine is baked into the schema's checks
 * and the function isn't easily extractable. For full L3 support,
 * the superRefine function would need to be extractable from Zod
 * internals — this is a known limitation.
 *
 * For now, L3 provides the infrastructure and type definitions.
 * Full static analysis of superRefine function bodies would require
 * either AST parsing or Zod v4 API changes to expose the function.
 *
 * This is intentionally conservative per spec:
 * "Everything else stays in schemaLite (safe fallback)"
 */
export function analyzeSchemaLite(
  _collector: FormOptimizerContext['schemaLite']
): AnalyzedSuperRefine[] {
  return [];
}

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
      watchValidate: undefined
    };
    targetField.zodSchema = undefined;

    collector.removeTopLevel(result.entry as any);
  }
}

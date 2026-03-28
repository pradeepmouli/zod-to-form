// TODO(L3): Implement cross-field static analysis when Zod v4 exposes superRefine functions.
//
// This module will analyze schemaLite checks for convertible superRefine patterns
// and produce watch+validate field configurations for real-time cross-field feedback.
//
// Design:
// - analyzeSchemaLite(collector) → AnalyzedSuperRefine[]
//   Parses superRefine function bodies for static patterns:
//   ctx.addIssue({ path: ['literal'] }), data.fieldA/data.fieldB references
//
// - applyL3Results(fields, results, collector) → void
//   Sets field.validation = { mode: 'watch', watchFields, watchValidate }
//   on target fields and removes converted checks from the collector
//
// Blocked on: Zod v4 bakes superRefine into schema checks — the callback
// function isn't directly extractable. Requires either AST parsing of
// function.toString() or a future Zod API to expose the function.
//
// interface AnalyzedSuperRefine {
//   targetPath: string;       // field that receives the error
//   watchFields: string[];    // fields the superRefine reads
//   entry: unknown;           // the check object from SchemaLiteCollector
// }
//
// export function analyzeSchemaLite(collector: SchemaLiteCollector): AnalyzedSuperRefine[] {
//   // Conservative: only convert patterns we can prove correct
//   return [];
// }
//
// export function applyL3Results(
//   fields: FormField[],
//   results: AnalyzedSuperRefine[],
//   collector: SchemaLiteCollector
// ): void {
//   for (const result of results) {
//     const target = fields.find((f) => f.key === result.targetPath);
//     if (!target) continue;
//     target.validation = { mode: 'watch', watchFields: result.watchFields };
//     target.zodSchema = undefined;
//   }
// }

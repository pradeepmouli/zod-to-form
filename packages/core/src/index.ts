/**
 * Schema-driven form generation for Zod v4.
 *
 * Two paths to forms:
 * - **CLI codegen** (recommended): Write a `z2f.config.ts`, run `npx zod-to-form generate`,
 *   get static `.tsx` components. Zero runtime overhead, hand-readable output.
 * - **Runtime**: Import `walkSchema()` and render dynamically with `useZodForm()` in React.
 *
 * Both paths share the same core: a recursive schema walker that produces `FormField[]`
 * from Zod v4's native introspection API.
 *
 * @remarks
 * Requires Zod v4 — uses `_zod.def`, `_zod.bag`, and `z.registry()` APIs.
 * Does NOT work with Zod v3 (which uses `_def` internals).
 *
 * Key concepts:
 * - **Processors**: Per-type handlers that extract structure from Zod schemas
 * - **Registry**: `z.registry<FormMeta>()` stores per-schema field config
 * - **Optimization**: L1 decomposes validation per-field, L2 extracts native HTML rules
 * - **Config presets**: `shadcn` preset maps to controlled components with field expressions
 *
 * @useWhen
 * - You have Zod v4 schemas and need forms generated from them
 * - You want type-safe form generation that stays in sync with your schema
 * - You need both runtime rendering and static codegen from the same schema
 *
 * @avoidWhen
 * - You're on Zod v3 — this library requires Zod v4's native API
 * - You need forms for non-Zod schemas (use a form builder instead)
 * - Your forms have no relationship to your validation schema
 *
 * @never
 * - NEVER use with Zod v3 — accessing `_zod.bag` on v3 schemas throws at runtime with cryptic errors
 * - NEVER forget to call `normalizeFormValues()` before `schema.safeParse()` — HTML inputs produce empty strings for unset optional fields, which Zod rejects as invalid
 * - NEVER pass a non-object schema as the root to `walkSchema()` — it must be `z.object({...})` at the top level
 * - NEVER mutate `builtinOptimizers` directly — it's a module-level singleton. Use `createOptimizers(custom)` to extend
 * - NEVER mix `registerDeep()` and `registerFlat()` on the same schema — registry entries conflict silently
 *
 * @packageDocumentation
 */

// @zod-to-form/core — Public API
// All exports are named exports only (no default, no `export *`) for full tree-shakeability.

export type {
  ArrayConfig,
  FormField,
  FormFieldOption,
  FormFieldConstraints,
  FormProcessor,
  FormProcessorContext,
  FormMeta,
  FieldConfig,
  FieldExpression,
  GhostRow,
  GhostRowContext,
  ProcessParams,
  WalkOptions,
  ZodFormRegistry,
  NativeRules,
  ValidationStrategy
} from './types.js';

export type {
  ComponentOverride,
  ComponentPreset,
  ComponentsConfig,
  TypedFieldConfig,
  ZodFormsConfig,
  ZodTypeConfig,
  ConfigDefaults,
  OptimizationConfig,
  StripIndexSignature
} from './config.js';

export type {
  FormOptimizer,
  FormOptimizerContext,
  WalkResult,
  SchemaLiteCollector,
  SchemaLiteInfo
} from './optimizers/index.js';

// CodegenConfig and its canonicalization helper — moved here from
// @zod-to-form/codegen so the Vite plugin and other consumers can depend
// on the type without pulling in the codegen package's runtime.
export type { CodegenConfig } from './config-types.js';
export { canonicalizeConfig } from './canonicalize-config.js';

export {
  createOptimizers,
  builtinOptimizers,
  createSchemaLiteCollector
} from './optimizers/index.js';

export {
  defineConfig,
  validateConfig,
  resolveFieldConfig,
  normalizeConfig,
  SHADCN_OVERRIDES,
  DEFAULT_OVERRIDES
} from './config.js';

export {
  inferLabel,
  joinPath,
  createBaseField,
  getEmptyDefault,
  normalizeFieldKey,
  collectFieldSections
} from './utils.js';

export { normalizeFormValues } from './normalize.js';
export { walkSchema } from './walker.js';
export { builtinProcessors, createProcessors } from './registry.js';
export { registerDeep, registerFlat, registerSchemaConfigs } from './register.js';
export * as processors from './processors/index.js';

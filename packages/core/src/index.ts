// @zod-to-form/core — Public API
// All exports are named exports only (no default, no `export *`) for full tree-shakeability.

export type {
  FormField,
  FormFieldOption,
  FormFieldConstraints,
  FormProcessor,
  FormProcessorContext,
  FormMeta,
  FieldConfig,
  FieldExpression,
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
  ValidationConfig,
  StripIndexSignature
} from './config.js';

export type {
  FormOptimizer,
  FormOptimizerContext,
  WalkResult,
  SchemaLiteCollector,
  SchemaLiteEntry
} from './optimizers/index.js';

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
export { registerDeep, registerFlat } from './register.js';
export * as processors from './processors/index.js';

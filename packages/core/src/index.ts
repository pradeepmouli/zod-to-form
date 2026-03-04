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
  ProcessParams,
  WalkOptions,
  ZodFormRegistry
} from './types.js';

export type {
  ComponentEntry,
  FieldTypePreset,
  FormPrimitivesConfig,
  TypedFieldConfig,
  ZodFormsConfig,
  ZodTypeConfig,
  ConfigDefaults,
  // Deprecated aliases
  FieldOverride,
  ZodToFormComponentConfig
} from './config.js';

export {
  defineConfig,
  validateConfig,
  resolveFieldConfig,
  normalizeConfig,
  SHADCN_FIELD_TYPES,
  DEFAULT_FIELD_TYPES,
  // Deprecated aliases
  defineComponentConfig,
  validateComponentConfig
} from './config.js';

export { inferLabel, joinPath, createBaseField } from './utils.js';

export { walkSchema } from './walker.js';
export { builtinProcessors, createProcessors } from './registry.js';
export * as processors from './processors/index.js';

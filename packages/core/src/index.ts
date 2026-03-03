// @zod-to-form/core — Public API
// All exports are named exports only (no default, no `export *`) for full tree-shakeability.

export type {
  FormField,
  FormFieldOption,
  FormFieldConstraints,
  FormProcessor,
  FormProcessorContext,
  FormMeta,
  ProcessParams,
  WalkOptions,
  ZodFormRegistry
} from './types.js';

export type {
  ComponentEntry,
  FieldOverride,
  ZodToFormComponentConfig
} from './component-config.js';

export { defineComponentConfig, validateComponentConfig } from './component-config.js';

export { inferLabel, joinPath, createBaseField } from './utils.js';

export { walkSchema } from './walker.js';
export { builtinProcessors, createProcessors } from './registry.js';
export * as processors from './processors/index.js';

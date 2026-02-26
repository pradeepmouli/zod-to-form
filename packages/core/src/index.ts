// @zodform/core — Public API

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

export { inferLabel, joinPath, createBaseField } from './utils.js';

// Walker and processors — stubs until Phase 3 implementation
export { walkSchema } from './walker.js';
export { builtinProcessors, createProcessors } from './registry.js';

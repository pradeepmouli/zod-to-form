// @zod-to-form/react — Public API

// Re-export core types consumers may need
export type {
  FormField,
  FormFieldOption,
  FormFieldConstraints,
  FormMeta,
  FieldConfig,
  WalkOptions
} from '@zod-to-form/core';

// Runtime renderer
export { ZodForm } from './ZodForm.js';
export { useZodForm } from './useZodForm.js';
// Re-export normalizeFormValues from core for backward compatibility
export { normalizeFormValues } from '@zod-to-form/core';
export { wrapWithSchemaLite } from './SchemaLiteSubmit.js';
export { defaultComponentMap } from './components/index.js';
export { shadcnComponentMap } from './shadcn/index.js';

// User-facing component names (excludes internal Field wrappers)
export { FIELD_COMPONENT_NAMES } from './components/index.js';
export type { RuntimeComponentConfig, FieldTemplateProps } from './FieldRenderer.js';

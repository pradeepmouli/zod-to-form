// @zod-to-form/codegen — Browser-safe code generation for Zod v4 forms
// No Node.js dependencies. Usable in browser and server environments.

export { generateFormComponent, resolveFieldMapping } from './generate.js';
export type { CodegenConfig } from './generate.js';

export { getFileHeader, renderField, registerPathExpr } from './templates.js';

export { buildConfigSource } from './config-template.js';
export type { ConfigTemplateOptions } from './config-template.js';

export { getFieldTemplateSource, PRESET_TEMPLATE_IMPORTS } from './field-templates.js';

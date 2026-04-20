/**
 * Browser-safe code generation utilities for Zod v4 form components.
 *
 * Provides the building blocks for generating React form TSX files from a
 * `FormField[]` tree and a `ZodFormsConfig`. No Node.js dependencies — safe
 * to import in browser and server environments alike.
 *
 * Key exports:
 * - `generateFormComponent` — produce a complete TSX form component string
 * - `getFileHeader` — emit import declarations for generated files
 * - `renderField` — render a single field to its JSX string
 * - `buildConfigSource` — generate a `z2f.config.ts` starter file
 * - `getFieldTemplateSource` — emit the preset FieldTemplate component source
 * - `generateSchemaLiteFile` — emit the lite schema file for optimized validation
 *
 * @useWhen
 * - You are building a custom codegen pipeline on top of `walkSchema`
 * - You need to generate form components programmatically (e.g. a playground or IDE plugin)
 *
 * @avoidWhen
 * - You just want to generate forms — use the CLI (`npx zod-to-form generate`) instead
 *
 * @pitfalls
 * - NEVER import this in a browser bundle that tree-shakes — the template strings are large.
 *   Use dynamic `import()` if you only need codegen in certain code paths.
 *
 * @packageDocumentation
 */

// @zod-to-form/codegen — Browser-safe code generation for Zod v4 forms
// No Node.js dependencies. Usable in browser and server environments.

export { generateFormComponent, resolveFieldMapping } from './generate.js';
export type { CodegenConfig } from './generate.js';

export { getFileHeader, renderField, registerPathExpr } from './templates.js';

export { generateSchemaLiteFile } from './schema-lite-codegen.js';

export { buildConfigSource } from './config-template.js';
export type { ConfigTemplateOptions } from './config-template.js';

export { getFieldTemplateSource, PRESET_TEMPLATE_IMPORTS } from './field-templates.js';

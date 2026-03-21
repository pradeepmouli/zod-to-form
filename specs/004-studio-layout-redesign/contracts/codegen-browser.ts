/**
 * Contract: Browser-compatible codegen interface.
 *
 * The CLI codegen pipeline must be usable in-browser for the
 * "CLI (Codegen)" code output mode. This contract defines the
 * subset of the CLI's codegen API that the playground imports.
 */

import type { FormField } from '@zod-to-form/core';

/** Configuration for the codegen output */
export interface CodegenConfig {
  /** Component name for the generated form */
  componentName?: string;
  /** Schema export name (for import statement) */
  schemaExportName?: string;
  /** Component library preset */
  ui?: 'shadcn' | 'default';
  /** Whether to generate server action boilerplate */
  serverAction?: boolean;
  /** Form primitives configuration */
  formPrimitives?: {
    enabled: boolean;
    imports?: Record<string, string>;
  };
}

/**
 * Generates a complete static form component from FormField[] IR.
 * This is the same function used by the CLI's `z2f generate` command.
 *
 * Must be browser-compatible (no Node.js APIs).
 *
 * @param fields - FormField[] intermediate representation from walkSchema()
 * @param config - Codegen configuration
 * @returns Complete .tsx file content as a string
 */
export type GenerateFormComponent = (fields: FormField[], config: CodegenConfig) => string;

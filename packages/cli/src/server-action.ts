import path from 'node:path';
import type { CodegenConfig } from './codegen.js';

/**
 * Compute the relative import path from the action file to the schema file.
 * The action file sits alongside the form component (same directory).
 */
function schemaImportPath(config: CodegenConfig): string {
  const rel = path.relative(path.dirname(config.outputPath), config.schemaPath).replace(/\\/g, '/');
  const withSlash = rel.startsWith('.') ? rel : `./${rel}`;
  // Replace .ts extension with .js for ESM compatibility
  return withSlash.replace(/\.ts$/, '.js');
}

/** Derive camelCase action function name from PascalCase component name */
function toActionName(componentName: string): string {
  return componentName.charAt(0).toLowerCase() + componentName.slice(1) + 'Action';
}

/**
 * Generate a Next.js server action TypeScript file from the codegen config.
 *
 * The generated file:
 * - Has a `"use server"` directive
 * - Imports the Zod schema (no @zod-to-form/* imports)
 * - Declares a typed FormState type
 * - Exports an async action that validates formData via safeParse
 * - Returns fieldErrors on validation failure or a success message on pass
 */
export async function generateServerAction(config: CodegenConfig): Promise<string> {
  const { exportName, componentName } = config;
  const importPath = schemaImportPath(config);
  const stateName = `${componentName}State`;
  const actionName = toActionName(componentName);

  return [
    '"use server";',
    '',
    `import { ${exportName} } from '${importPath}';`,
    '',
    `export type ${stateName} = {`,
    `  errors: Partial<Record<string, string[]>>;`,
    `  message: string | null;`,
    `};`,
    '',
    `export async function ${actionName}(`,
    `  _prevState: ${stateName},`,
    `  formData: FormData`,
    `): Promise<${stateName}> {`,
    `  const result = ${exportName}.safeParse(Object.fromEntries(formData));`,
    '',
    `  if (!result.success) {`,
    `    const fieldErrors = result.error.flatten().fieldErrors;`,
    `    return { errors: fieldErrors, message: null };`,
    `  }`,
    '',
    `  return { errors: {}, message: 'Form submitted successfully.' };`,
    `}`,
    ''
  ].join('\n');
}

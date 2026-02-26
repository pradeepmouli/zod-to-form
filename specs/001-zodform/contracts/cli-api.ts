/**
 * @zodform/cli — API Contract
 *
 * This file defines the CLI interface and codegen configuration.
 * Implementation MUST satisfy these interfaces.
 */

// ─── CLI Options ──────────────────────────────────────────────────────

export interface CLIOptions {
  /** Path to the TypeScript file containing the schema */
  schema: string;
  /** Named export of the Zod schema from the file */
  export: string;
  /** Output directory or file path (default: same directory as schema) */
  out?: string;
  /** Component name for the generated form (default: inferred from export) */
  name?: string;
  /** UI library preset: "shadcn" | "unstyled" (default: "shadcn") */
  ui?: "shadcn" | "unstyled";
  /** Generate a Next.js server action alongside the form */
  serverAction?: boolean;
  /** Watch mode: regenerate on schema file changes */
  watch?: boolean;
  /** Force overwrite of user-owned config files */
  force?: boolean;
  /** Dry run: print generated output without writing files */
  dryRun?: boolean;
}

/**
 * CLI command signature:
 *
 * zodform generate \
 *   --schema src/schemas/user.ts \
 *   --export userSchema \
 *   [--out src/components/] \
 *   [--name UserForm] \
 *   [--ui shadcn|unstyled] \
 *   [--server-action] \
 *   [--watch] \
 *   [--force] \
 *   [--dry-run]
 */

// ─── Codegen Config ───────────────────────────────────────────────────

export interface CodegenConfig {
  /** Resolved schema file path */
  schemaPath: string;
  /** Schema export name */
  exportName: string;
  /** Output file path for the form component */
  outputPath: string;
  /** Generated component name (PascalCase) */
  componentName: string;
  /** UI library preset */
  ui: "shadcn" | "unstyled";
  /** Whether to generate a server action */
  serverAction: boolean;
}

// ─── Generated File Structure ─────────────────────────────────────────

/**
 * For `zodform generate --schema src/schemas/user.ts --export userSchema`:
 *
 * src/components/
 * ├── UserForm.tsx           # Generated form component (always regenerated)
 * └── user-form-action.ts    # Server action (if --server-action, always regenerated)
 *
 * Generated form component structure:
 * - Imports: react-hook-form, zod, @hookform/resolvers/zod, UI components
 * - Schema import: imports the original schema for zodResolver
 * - Component: explicit JSX with register/Controller for each field
 * - Types: z.infer<typeof schema> for form data
 * - NO runtime dependency on @zodform/* packages
 */

// ─── Codegen Functions ────────────────────────────────────────────────

import type { FormField } from "./core-api";

/**
 * Generate a form component .tsx file from FormField[].
 *
 * @param fields - FormField[] from walkSchema
 * @param config - Codegen configuration
 * @returns Generated TypeScript/JSX source code string
 */
export declare function generateFormComponent(
  fields: FormField[],
  config: CodegenConfig
): Promise<string>;

/**
 * Generate a Next.js server action from the schema.
 *
 * @param config - Codegen configuration
 * @returns Generated TypeScript source code string
 */
export declare function generateServerAction(
  config: CodegenConfig
): Promise<string>;

/**
 * Load a Zod schema from a TypeScript file using jiti.
 *
 * @param schemaPath - Absolute path to the TypeScript file
 * @param exportName - Named export containing the Zod schema
 * @returns The Zod schema object
 * @throws Error if the file cannot be loaded or the export is not a Zod schema
 */
export declare function loadSchema(
  schemaPath: string,
  exportName: string
): Promise<unknown>;

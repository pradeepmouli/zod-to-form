/**
 * Canonical home for the `CodegenConfig` shape.
 *
 * Moved from `@zod-to-form/codegen` as part of feature 007-vite-codegen-plugin
 * so the type is reachable by every consumer (codegen, cli, vite plugin,
 * playground) without forcing a dependency on the codegen package. Codegen
 * re-exports this type from its own `index.ts` so existing imports of
 * `@zod-to-form/codegen`'s `CodegenConfig` continue to work unchanged.
 */
import type { ZodFormsConfig } from './config.js';
import type { SchemaLiteInfo } from './optimizers/types.js';

export type CodegenConfig = {
  /**
   * Optional pre-computed import path for the schema (e.g., `./schema.js`).
   * Defaults to `./schema`. The CLI typically computes this from file paths;
   * the browser playground and Vite plugin can pass it explicitly.
   */
  schemaImportPath?: string;
  exportName: string;
  componentName: string;
  mode: 'submit' | 'auto-save';
  componentConfig?: ZodFormsConfig<Record<string, unknown>>;
  ui: 'shadcn' | 'html';
  /** @deprecated Currently unused. Reserved for future server action codegen support. */
  serverAction?: boolean;
  /** Force FormProvider wrapper in submit mode. Auto-save mode always uses FormProvider regardless. */
  formProvider?: boolean;
  /** Validation optimization level. When set, generated code uses per-field validation instead of zodResolver. */
  validationLevel?: 1 | 2 | 3;
  /** SchemaLite for submit-time validation of top-level effects (null when no effects exist) */
  schemaLite?: import('zod/v4/core').$ZodType | null;
  /** Codegen metadata for generating the .lite.ts file */
  schemaLiteInfo?: SchemaLiteInfo;
  /** Output path of the form component — used to compute the .lite.ts import path */
  outputPath?: string;
};

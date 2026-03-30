import path from 'node:path';
import type { FormField, SchemaLiteInfo } from '@zod-to-form/core';
import {
  generateFormComponent as generateFormComponentBase,
  generateSchemaLiteFile as generateSchemaLiteFileBase,
  type CodegenConfig as CodegenConfigBase
} from '@zod-to-form/codegen';

// Re-export the browser-safe resolveFieldMapping for use by other CLI modules
export { resolveFieldMapping } from '@zod-to-form/codegen';

export type CodegenConfig = CodegenConfigBase & {
  /** Absolute path to schema file (used to compute relative import path) */
  schemaPath: string;
  /** Absolute path to output file (used to compute relative import path) */
  outputPath: string;
};

function getSchemaImportPath(config: CodegenConfig): string {
  const relative = path
    .relative(path.dirname(config.outputPath), config.schemaPath)
    .replace(/\\/g, '/');

  const withDot = relative.startsWith('.') ? relative : `./${relative}`;
  return withDot
    .replace(/\.mts$/i, '.mjs')
    .replace(/\.cts$/i, '.cjs')
    .replace(/\.tsx?$/i, '.js');
}

export async function generateFormComponent(
  fields: FormField[],
  config: CodegenConfig
): Promise<string> {
  const schemaImportPath = getSchemaImportPath(config);
  return generateFormComponentBase(fields, {
    ...config,
    schemaImportPath
  });
}

export function generateSchemaLiteFile(config: CodegenConfig, info: SchemaLiteInfo): string | null {
  const schemaImportPath = getSchemaImportPath(config);
  return generateSchemaLiteFileBase(schemaImportPath, config.exportName, info);
}

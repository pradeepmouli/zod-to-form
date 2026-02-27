import path from 'node:path';
import { createJiti } from 'jiti';

function isZodSchema(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return '_zod' in (value as Record<string, unknown>);
}

export async function loadSchema(schemaPath: string, exportName: string): Promise<unknown> {
  const absolutePath = path.resolve(schemaPath);
  const jiti = createJiti(import.meta.url, {
    moduleCache: false,
    interopDefault: true
  });

  let moduleExports: Record<string, unknown>;
  try {
    moduleExports = await jiti.import(absolutePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to load schema file "${absolutePath}": ${message}`);
  }

  if (!(exportName in moduleExports)) {
    throw new Error(`Export "${exportName}" was not found in schema file "${absolutePath}".`);
  }

  const candidate = moduleExports[exportName];
  if (!isZodSchema(candidate)) {
    throw new Error(`Export "${exportName}" from "${absolutePath}" is not a Zod schema.`);
  }

  return candidate;
}

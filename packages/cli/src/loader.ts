import path from 'node:path';
import { createRequire } from 'node:module';
import { createJiti } from 'jiti';
import type { ZodToFormComponentConfig } from './index.js';

const requireFromHere = createRequire(import.meta.url);

function resolveZodModulePath(): string {
  return requireFromHere.resolve('zod');
}

function isZodSchema(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return '_zod' in (value as Record<string, unknown>);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function validateComponentConfig(
  value: unknown,
  source = 'component-config'
): ZodToFormComponentConfig<Record<string, unknown>> {
  if (!isObjectRecord(value)) {
    throw new Error(`${source} must be an object.`);
  }

  const components = value['components'];
  if (typeof components !== 'string' || components.trim().length === 0) {
    throw new Error(`${source}.components must be a non-empty string.`);
  }

  const fieldTypes = value['fieldTypes'];
  if (!isObjectRecord(fieldTypes)) {
    throw new Error(`${source}.fieldTypes must be an object.`);
  }

  for (const [fieldType, entryValue] of Object.entries(fieldTypes)) {
    if (!isObjectRecord(entryValue)) {
      throw new Error(`${source}.fieldTypes.${fieldType} must be an object.`);
    }

    const component = entryValue['component'];
    if (typeof component !== 'string' || component.trim().length === 0) {
      throw new Error(`${source}.fieldTypes.${fieldType}.component must be a non-empty string.`);
    }

    const render = entryValue['render'];
    if (render !== undefined && typeof render !== 'function') {
      throw new Error(`${source}.fieldTypes.${fieldType}.render must be a function when provided.`);
    }
  }

  const fields = value['fields'];
  if (fields !== undefined) {
    if (!isObjectRecord(fields)) {
      throw new Error(`${source}.fields must be an object when provided.`);
    }

    for (const [fieldPath, overrideValue] of Object.entries(fields)) {
      if (!isObjectRecord(overrideValue)) {
        throw new Error(`${source}.fields.${fieldPath} must be an object.`);
      }

      const fieldType = overrideValue['fieldType'];
      if (typeof fieldType !== 'string' || fieldType.trim().length === 0) {
        throw new Error(`${source}.fields.${fieldPath}.fieldType must be a non-empty string.`);
      }

      const props = overrideValue['props'];
      if (props !== undefined && !isObjectRecord(props)) {
        throw new Error(`${source}.fields.${fieldPath}.props must be an object when provided.`);
      }
    }
  }

  return value as ZodToFormComponentConfig<Record<string, unknown>>;
}

function getDefaultExport(moduleExports: Record<string, unknown>): unknown {
  if ('default' in moduleExports) {
    return moduleExports['default'];
  }

  return moduleExports;
}

export async function loadSchema(schemaPath: string, exportName: string): Promise<unknown> {
  const absolutePath = path.resolve(schemaPath);
  const jiti = createJiti(import.meta.url, {
    moduleCache: false,
    interopDefault: true,
    alias: {
      zod: resolveZodModulePath()
    },
    nativeModules: ['zod']
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

export async function loadComponentConfig(
  configPath: string
): Promise<ZodToFormComponentConfig<Record<string, unknown>>> {
  const absolutePath = path.resolve(configPath);
  const jiti = createJiti(import.meta.url, {
    moduleCache: false,
    interopDefault: true
  });

  let moduleExports: Record<string, unknown>;
  try {
    moduleExports = await jiti.import(absolutePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to load component config file "${absolutePath}": ${message}`);
  }

  const configValue = getDefaultExport(moduleExports);
  return validateComponentConfig(configValue, `component-config (${absolutePath})`);
}

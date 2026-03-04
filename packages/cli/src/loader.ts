import path from 'node:path';
import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createJiti } from 'jiti';
import {
  validateConfig,
  normalizeConfig,
  type ZodFormsConfig
} from '@zod-to-form/core';

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

export async function resolveSchemaExportNames(schemaPath: string): Promise<string[]> {
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

  return Object.entries(moduleExports)
    .filter(([, candidate]) => isZodSchema(candidate))
    .map(([name]) => name)
    .sort();
}

export async function loadConfig(
  configPath: string
): Promise<ZodFormsConfig<Record<string, unknown>>> {
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
  const validated = validateConfig(configValue, `component-config (${absolutePath})`);
  return normalizeConfig(validated);
}

/** @deprecated Use loadConfig instead */
export const loadComponentConfig = loadConfig;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveDefaultConfigPath(cwd: string): Promise<string | undefined> {
  const candidates = [
    'z2f.config.ts',
    'component-config.ts',
    'z2f.config.js',
    'component-config.js',
    'z2f.config.json',
    'component-config.json'
  ].map((candidate) => path.resolve(cwd, candidate));

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

/** @deprecated Use resolveDefaultConfigPath instead */
export const resolveDefaultComponentConfigPath = resolveDefaultConfigPath;

export async function loadDefaultConfig(
  cwd: string
): Promise<ZodFormsConfig<Record<string, unknown>> | undefined> {
  const defaultPath = await resolveDefaultConfigPath(cwd);
  if (!defaultPath) {
    return undefined;
  }

  return loadConfig(defaultPath);
}

/** @deprecated Use loadDefaultConfig instead */
export const loadDefaultComponentConfig = loadDefaultConfig;

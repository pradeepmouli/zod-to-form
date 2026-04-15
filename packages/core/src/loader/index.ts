/**
 * Schema and component-config loader.
 *
 * Node-only: dynamically loads `jiti` to evaluate user TypeScript / ESM
 * files at runtime. Imported via the `@zod-to-form/core/loader` subpath
 * so browser builds of `@zod-to-form/core` never pull jiti or any Node
 * built-ins into the bundle.
 *
 * `jiti` is declared as an **optional peer** of `@zod-to-form/core` —
 * the loader dynamically imports it on first use and throws a clear
 * install hint when it's missing. This lets browser-only consumers
 * (the React runtime, the playground) skip the install entirely while
 * Node-side consumers (CLI, Vite plugin) opt in by depending on jiti
 * directly.
 *
 * Both the CLI and the Vite plugin need the same primitives: load a
 * schema file by path, list its named Zod schema exports, and load a
 * component config file with validation. Centralizing here keeps the
 * two surfaces byte-for-byte consistent (FR-019 / SC-006 codegen parity).
 */
import path from 'node:path';
import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import type { ZodFormsConfig } from '../config.js';
import { validateConfig, normalizeConfig } from '../config.js';

const requireFromHere = createRequire(import.meta.url);

function resolveZodModulePath(): string {
  return requireFromHere.resolve('zod');
}

/**
 * Structural type for the slice of `jiti`'s API the loader uses. Kept
 * minimal so the dynamic import doesn't need the full upstream type.
 */
interface JitiInstance {
  import(specifier: string): Promise<Record<string, unknown>>;
}
interface JitiModule {
  createJiti: (parent: string, options: Record<string, unknown>) => JitiInstance;
}

let cachedJitiModule: JitiModule | null = null;

/**
 * Dynamically import `jiti` on first use. Cached so repeated calls don't
 * re-resolve. Throws a clear, actionable error when the package isn't
 * installed, instead of letting Node's raw `Cannot find module` bubble.
 */
async function loadJitiModule(): Promise<JitiModule> {
  if (cachedJitiModule !== null) return cachedJitiModule;
  try {
    cachedJitiModule = (await import('jiti')) as unknown as JitiModule;
    return cachedJitiModule;
  } catch (err) {
    throw new Error(
      `@zod-to-form/core/loader requires 'jiti' to evaluate user schema files. Install it as a dependency:\n\n  pnpm add jiti\n\n(jiti is declared as an optional peer of @zod-to-form/core; consumers that load schemas at runtime are expected to install it directly. Original error: ${
        err instanceof Error ? err.message : String(err)
      })`
    );
  }
}

/**
 * Structural Zod-v4 check. Tightened to require `_zod` be a non-null
 * object (not just present) so a plain `{ _zod: null }` doesn't slip
 * past the guard. Kept here as a duplicate of the Vite plugin's
 * `config/load.ts` version because core can't depend on @zod-to-form/vite,
 * and lifting the helper into `@zod-to-form/core/index` would expose a
 * Zod-internals leak through the main entry point. Both implementations
 * now agree: presence of a non-null `_zod` object is the contract.
 */
function isZodSchema(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const zodInternal = (value as { _zod?: unknown })._zod;
  return typeof zodInternal === 'object' && zodInternal !== null;
}

function getDefaultExport(moduleExports: Record<string, unknown>): unknown {
  if ('default' in moduleExports) {
    return moduleExports['default'];
  }
  return moduleExports;
}

async function makeJiti(): Promise<JitiInstance> {
  const { createJiti } = await loadJitiModule();
  return createJiti(import.meta.url, {
    moduleCache: false,
    interopDefault: true,
    alias: {
      zod: resolveZodModulePath()
    },
    nativeModules: ['zod']
  });
}

async function makeJitiNoAlias(): Promise<JitiInstance> {
  const { createJiti } = await loadJitiModule();
  return createJiti(import.meta.url, {
    moduleCache: false,
    interopDefault: true
  });
}

/**
 * Load a single named Zod schema export from a TypeScript or JavaScript
 * file. Throws with a clear message when the file can't be read, the
 * export doesn't exist, or the export isn't a Zod schema.
 */
export async function loadSchema(schemaPath: string, exportName: string): Promise<unknown> {
  const absolutePath = path.resolve(schemaPath);
  const jiti = await makeJiti();

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

/**
 * Load a schema file and return the entire module namespace, leaving the
 * choice of which export to use to the caller. The Vite plugin uses this
 * variant so it can run its own export-disambiguation pass.
 */
export async function loadSchemaModule(schemaPath: string): Promise<Record<string, unknown>> {
  const absolutePath = path.resolve(schemaPath);
  const jiti = await makeJiti();

  try {
    return await jiti.import(absolutePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to load schema file "${absolutePath}": ${message}`);
  }
}

/**
 * Return the sorted list of named Zod schema exports in a schema file.
 * Used by the CLI's `--list-exports` flag and the Vite plugin's
 * ambiguous-export error message.
 */
export async function resolveSchemaExportNames(schemaPath: string): Promise<string[]> {
  const moduleExports = await loadSchemaModule(schemaPath);
  return Object.entries(moduleExports)
    .filter(([, candidate]) => isZodSchema(candidate))
    .map(([name]) => name)
    .sort();
}

/**
 * Load and validate a component config file (`z2f.config.ts` or similar).
 * Returns the normalized form ready to feed into codegen.
 */
export async function loadConfig(
  configPath: string
): Promise<ZodFormsConfig<Record<string, unknown>>> {
  const absolutePath = path.resolve(configPath);
  const jiti = await makeJitiNoAlias();

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

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Walk the standard config-file naming candidates in `cwd` and return the
 * first that exists. Used by the CLI's auto-discovery and (eventually) by
 * the Vite plugin's config watcher.
 */
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

export async function loadDefaultConfig(
  cwd: string
): Promise<ZodFormsConfig<Record<string, unknown>> | undefined> {
  const defaultPath = await resolveDefaultConfigPath(cwd);
  if (!defaultPath) {
    return undefined;
  }
  return loadConfig(defaultPath);
}

#!/usr/bin/env node

/**
 * @zod-to-form/cli — Build-time code generator for Zod v4 forms
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import {
  defineConfig,
  validateConfig,
  resolveFieldConfig,
  registerFlat,
  type ComponentOverride,
  type FieldConfig,
  type FormMeta,
  type FormPrimitivesConfig,
  type ZodFormsConfig,
  walkSchema
} from '@zod-to-form/core';
import { z } from 'zod';
import { generateFormComponent } from './codegen.js';
import { loadConfig, loadSchema, resolveSchemaExportNames } from './loader.js';
import { runInit, type InitOptions } from './init.js';
import { generateServerAction } from './server-action.js';
import { startWatch } from './watcher.js';

export { defineConfig, validateConfig };

export type { ComponentOverride, FieldConfig, FormPrimitivesConfig, ZodFormsConfig };

type GenerateOptions = {
  config: string;
  schema: string;
  export?: string;
  mode?: 'submit' | 'auto-save';
  out?: string;
  name?: string;
  ui?: 'shadcn' | 'html';
  dryRun?: boolean;
  serverAction?: boolean;
  watch?: boolean;
  /** Pre-loaded config to avoid redundant file loads */
  _loadedConfig?: ZodFormsConfig<Record<string, unknown>>;
};

import { applyExportFilters } from './filters.js';

function toPascalCase(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toKebabCase(value: string): string {
  return value.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`).replace(/^-/, '');
}

function resolveComponentName(exportName: string, explicitName?: string): string {
  if (explicitName?.trim()) {
    return toPascalCase(explicitName.trim());
  }

  const normalized = exportName.endsWith('Schema')
    ? exportName.slice(0, -'Schema'.length)
    : exportName;

  return `${toPascalCase(normalized)}Form`;
}

function resolveOutputPath(cwd: string, out: string | undefined, componentName: string): string {
  if (!out) {
    return path.resolve(cwd, `${componentName}.tsx`);
  }

  const absoluteOut = path.resolve(cwd, out);
  if (absoluteOut.endsWith('.tsx')) {
    return absoluteOut;
  }

  return path.join(absoluteOut, `${componentName}.tsx`);
}

export async function runGenerate(options: GenerateOptions): Promise<{
  outputPath: string;
  code: string;
  wroteFile: boolean;
  actionPath?: string;
  actionCode?: string;
}> {
  const cwd = process.cwd();
  const schemaPath = path.resolve(cwd, options.schema);
  if (!options.export) {
    throw new Error('runGenerate requires an explicit export name.');
  }
  const exportName = options.export;
  const componentConfig =
    options._loadedConfig ?? (await loadConfig(path.resolve(cwd, options.config)));

  // Merge config defaults with CLI flags (CLI flag > schemas.X.[prop] > defaults.[prop])
  const schemaConfig = componentConfig.schemas?.[exportName];
  const componentName = resolveComponentName(exportName, options.name ?? schemaConfig?.name);
  const effectiveMode =
    options.mode ?? schemaConfig?.mode ?? componentConfig.defaults?.mode ?? 'submit';
  const effectiveOut = options.out ?? schemaConfig?.out ?? componentConfig.defaults?.out;
  const effectiveServerAction =
    options.serverAction ??
    schemaConfig?.serverAction ??
    componentConfig.defaults?.serverAction ??
    false;
  const effectiveUi = options.ui ?? componentConfig.defaults?.ui ?? 'shadcn';
  const effectiveOverwrite = componentConfig.defaults?.overwrite ?? false;

  const outputPath = resolveOutputPath(cwd, effectiveOut, componentName);
  const schema = await loadSchema(schemaPath, exportName);

  // Merge field configs: schemas.X.fields over global fields
  const mergedFields = resolveFieldConfig(componentConfig.fields, schemaConfig?.fields);

  // Populate a fresh registry from the merged flat config so walkSchema
  // sees the same overrides that codegen templates used to apply manually.
  const formRegistry = z.registry<FormMeta>();
  if (Object.keys(mergedFields).length > 0) {
    // SAFETY: ZodObject extends $ZodType at runtime but TS nominal typing requires the cast
    registerFlat(formRegistry, schema as never, mergedFields);
  }

  // SAFETY: same as above — loadSchema returns a ZodObject which is $ZodType at runtime
  const fields = walkSchema(schema as never, { formRegistry });

  const config = {
    schemaPath,
    exportName,
    outputPath,
    componentName,
    mode: effectiveMode,
    componentConfig: {
      ...componentConfig,
      fields: Object.keys(mergedFields).length > 0 ? mergedFields : componentConfig.fields
    },
    ui: effectiveUi,
    serverAction: effectiveServerAction
  };

  const generated = await generateFormComponent(fields, config);
  const code = generated;

  if (options.dryRun) {
    process.stdout.write(code);
    return { outputPath, code, wroteFile: false };
  }

  try {
    await readFile(outputPath, 'utf8');
    if (!effectiveOverwrite) {
      return { outputPath, code, wroteFile: false };
    }
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new Error(
        `Cannot read existing file at "${outputPath}": ${(error as Error).message}. Check file permissions.`,
        { cause: error }
      );
    }
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, code, 'utf8');

  // Generate server action alongside the form component when requested
  if (effectiveServerAction) {
    const actionFileName = `${toKebabCase(componentName)}-action.ts`;
    const actionPath = path.join(path.dirname(outputPath), actionFileName);
    const actionCode = await generateServerAction({ ...config, outputPath: actionPath });
    await writeFile(actionPath, actionCode, 'utf8');
    return { outputPath, code, wroteFile: true, actionPath, actionCode };
  }

  return { outputPath, code, wroteFile: true };
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name('zod-to-form')
    .description('Generate form components from Zod v4 schemas')
    .version('0.0.0');

  program
    .command('generate')
    .requiredOption('--config <path>', 'Path to generate config (.json or .ts)')
    .requiredOption('--schema <path>', 'Path to schema file')
    .option(
      '--export <name>',
      'Named export containing the schema (optional when config.types/include are used)'
    )
    .option('--mode <mode>', 'Generation mode (submit|auto-save)')
    .option('--out <path>', 'Output directory or file path')
    .option('--name <componentName>', 'Generated component name')
    .option('--ui <preset>', 'UI preset (shadcn|html)')
    .option('--dry-run', 'Print generated code without writing files', false)
    .option('--server-action', 'Generate a Next.js server action alongside the form', false)
    .option('--watch', 'Watch schema file for changes and regenerate on change', false)
    .action(async (commandOptions: GenerateOptions) => {
      const cwd = process.cwd();
      const configPath = path.resolve(cwd, commandOptions.config);
      const config = await loadConfig(configPath);
      const schemaPath = path.resolve(cwd, commandOptions.schema);

      const exportNames = commandOptions.export
        ? [commandOptions.export]
        : config.types && config.types.length > 0
          ? config.types
          : applyExportFilters(
              await resolveSchemaExportNames(schemaPath),
              config.include,
              config.exclude
            );

      if (exportNames.length === 0) {
        throw new Error(
          'No schema exports selected. Provide --export, config.types, or config.include/config.exclude patterns.'
        );
      }

      const results: Array<{ componentName: string; outputPath: string }> = [];
      for (const exportName of exportNames) {
        const result = await runGenerate({
          ...commandOptions,
          export: exportName,
          _loadedConfig: config
        });
        const schemaConfig = config.schemas?.[exportName];
        const componentName = resolveComponentName(
          exportName,
          commandOptions.name ?? schemaConfig?.name
        );
        results.push({ componentName, outputPath: result.outputPath });
      }

      // T043: Print styled list of generated forms
      if (!commandOptions.dryRun && results.length > 0) {
        console.log('\nGenerated forms:');
        for (const { componentName, outputPath } of results) {
          const relativePath = path.relative(cwd, outputPath);
          console.log(`  \u2713 ${componentName} \u2192 ${relativePath}`);
        }
      }

      if (commandOptions.watch) {
        const schemaPath = path.resolve(process.cwd(), commandOptions.schema);
        console.log('Watching for changes...');
        await startWatch(schemaPath, () =>
          Promise.all(
            exportNames.map((exportName: string) =>
              runGenerate({ ...commandOptions, export: exportName, _loadedConfig: config })
            )
          ).then(() => {})
        );
      }
    });

  program
    .command('init')
    .description('Create z2f.config.ts with sensible defaults and optional shadcn introspection')
    .option('--out <path>', 'Output path to write z2f.config.ts', 'z2f.config.ts')
    .option(
      '--components <modulePath>',
      'Module path used in generated z2f.config.ts (overrides shadcn inference)'
    )
    .option('--schemas <path>', 'Path to schema file or directory for autodiscovery')
    .option('--force', 'Overwrite existing component config file', false)
    .option('--dry-run', 'Print generated config without writing files', false)
    .option('--verbose', 'Print detailed diagnostics and per-step details', false)
    .action(async (commandOptions: InitOptions) => {
      await runInit(commandOptions);
    });

  return program;
}

function isExecutedAsMain(): boolean {
  const argvPath = process.argv[1];
  if (!argvPath || !existsSync(argvPath)) {
    return false;
  }

  const entryPath = fileURLToPath(import.meta.url);

  try {
    return realpathSync(entryPath) === realpathSync(argvPath);
  } catch {
    return path.resolve(entryPath) === path.resolve(argvPath);
  }
}

if (isExecutedAsMain()) {
  const program = createProgram();
  await program.parseAsync();
}

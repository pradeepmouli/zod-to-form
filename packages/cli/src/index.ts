#!/usr/bin/env node

/**
 * @zod-to-form/cli — Build-time code generator for Zod v4 forms
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import type { Paths as TypeFestPaths } from 'type-fest';
import {
  walkSchema
} from '@zod-to-form/core';
import { generateFormComponent } from './codegen.js';
import { loadComponentConfig, loadSchema, resolveSchemaExportNames } from './loader.js';
import { runInit, type InitOptions } from './init.js';
import { validateComponentConfig } from './component-config.js';
import { generateServerAction } from './server-action.js';
import { startWatch } from './watcher.js';

export type ComponentEntry<T extends Record<string, unknown> = Record<string, unknown>> = {
  component: keyof T & string;
  render?: () => Promise<unknown>;
};

export { validateComponentConfig };

type NormalizeArrayPath<TPath extends string> =
  TPath extends `${infer Prefix}[${number}]${infer Suffix}`
    ? NormalizeArrayPath<`${Prefix}[]${Suffix}`>
    : TPath extends `${infer Prefix}.${number}.${infer Suffix}`
      ? NormalizeArrayPath<`${Prefix}[].${Suffix}`>
      : TPath extends `${infer Prefix}.${number}`
        ? NormalizeArrayPath<`${Prefix}[]`>
        : TPath;

export type FieldPath<TValues extends Record<string, unknown>> =
  TypeFestPaths<TValues> extends infer TPath
    ? TPath extends string
      ? TPath | NormalizeArrayPath<TPath>
      : never
    : never;

export type FieldOverride = {
  fieldType: string;
  props?: Record<string, unknown>;
};

export type FormPrimitivesConfig<T extends Record<string, unknown> = Record<string, unknown>> = {
  field?: keyof T & string;
  label?: keyof T & string;
  control?: keyof T & string;
};

export type ZodToFormComponentConfig<
  T extends Record<string, unknown> = Record<string, unknown>,
  TFieldPath extends string = string
> = {
  components: string;
  overwrite?: boolean;
  include?: string[];
  exclude?: string[];
  types?: string[];
  fieldTypes: Record<string, ComponentEntry<T>>;
  formPrimitives?: FormPrimitivesConfig<T>;
  fields?: Partial<Record<TFieldPath, FieldOverride>>;
};

export function defineComponentConfig<
  TComponents extends Record<string, unknown>,
  TValues extends Record<string, unknown>
>(
  config: ZodToFormComponentConfig<TComponents, FieldPath<TValues>>
): ZodToFormComponentConfig<TComponents, FieldPath<TValues>> {
  return config;
}

type GenerateOptions = {
  config: string;
  schema: string;
  export?: string;
  mode?: 'submit' | 'auto-save';
  out?: string;
  name?: string;
  ui?: 'shadcn' | 'unstyled';
  dryRun?: boolean;
  serverAction?: boolean;
  watch?: boolean;
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
  const componentName = resolveComponentName(exportName, options.name);
  const outputPath = resolveOutputPath(cwd, options.out, componentName);
  const schema = await loadSchema(schemaPath, exportName);
  const fields = walkSchema(schema as never);
  const componentConfig = await loadComponentConfig(path.resolve(cwd, options.config));

  const config = {
    schemaPath,
    exportName,
    outputPath,
    componentName,
    mode: options.mode ?? 'submit',
    componentConfig,
    ui: options.ui ?? 'shadcn',
    serverAction: options.serverAction ?? false
  };

  const generated = await generateFormComponent(fields, config);
  const code = generated;

  if (options.dryRun) {
    process.stdout.write(code);
    return { outputPath, code, wroteFile: false };
  }

  try {
    await readFile(outputPath, 'utf8');
    if (!componentConfig.overwrite) {
      return { outputPath, code, wroteFile: false };
    }
  } catch {}

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, code, 'utf8');

  // Generate server action alongside the form component when requested
  if (options.serverAction) {
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
    .option('--mode <mode>', 'Generation mode (submit|auto-save)', 'submit')
    .option('--out <path>', 'Output directory or file path')
    .option('--name <componentName>', 'Generated component name')
    .option('--ui <preset>', 'UI preset (shadcn|unstyled)', 'shadcn')
    .option('--dry-run', 'Print generated code without writing files', false)
    .option('--server-action', 'Generate a Next.js server action alongside the form', false)
    .option('--watch', 'Watch schema file for changes and regenerate on change', false)
    .action(async (commandOptions: GenerateOptions) => {
      const cwd = process.cwd();
      const configPath = path.resolve(cwd, commandOptions.config);
      const config = await loadComponentConfig(configPath);
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

      for (const exportName of exportNames) {
        await runGenerate({ ...commandOptions, export: exportName });
      }

      if (commandOptions.watch) {
        const schemaPath = path.resolve(process.cwd(), commandOptions.schema);
        console.log('Watching for changes...');
        await startWatch(schemaPath, () =>
          Promise.all(
            exportNames.map((exportName) => runGenerate({ ...commandOptions, export: exportName }))
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

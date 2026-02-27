#!/usr/bin/env node

/**
 * @zod-to-form/cli — Build-time code generator for Zod v4 forms
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Command } from 'commander';
import { walkSchema } from '@zod-to-form/core';
import { generateFormComponent } from './codegen.js';
import { loadSchema } from './loader.js';
import { generateServerAction } from './server-action.js';
import { startWatch } from './watcher.js';

type GenerateOptions = {
  schema: string;
  export: string;
  out?: string;
  name?: string;
  ui?: 'shadcn' | 'unstyled';
  force?: boolean;
  dryRun?: boolean;
  serverAction?: boolean;
  watch?: boolean;
};

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
  const exportName = options.export;
  const componentName = resolveComponentName(exportName, options.name);
  const outputPath = resolveOutputPath(cwd, options.out, componentName);
  const schema = await loadSchema(schemaPath, exportName);
  const fields = walkSchema(schema as never);

  const config = {
    schemaPath,
    exportName,
    outputPath,
    componentName,
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
    if (!options.force) {
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
    .name('zodform')
    .description('Generate form components from Zod v4 schemas')
    .version('0.0.0');

  program
    .command('generate')
    .requiredOption('--schema <path>', 'Path to schema file')
    .requiredOption('--export <name>', 'Named export containing the schema')
    .option('--out <path>', 'Output directory or file path')
    .option('--name <componentName>', 'Generated component name')
    .option('--ui <preset>', 'UI preset (shadcn|unstyled)', 'shadcn')
    .option('--force', 'Overwrite existing output file', false)
    .option('--dry-run', 'Print generated code without writing files', false)
    .option('--server-action', 'Generate a Next.js server action alongside the form', false)
    .option('--watch', 'Watch schema file for changes and regenerate on change', false)
    .action(async (commandOptions: GenerateOptions) => {
      await runGenerate(commandOptions);

      if (commandOptions.watch) {
        const schemaPath = path.resolve(process.cwd(), commandOptions.schema);
        console.log('Watching for changes...');
        await startWatch(schemaPath, () =>
          runGenerate({ ...commandOptions, force: true }).then(() => {})
        );
      }
    });

  return program;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const program = createProgram();
  await program.parseAsync();
}

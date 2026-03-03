import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type InitOptions = {
  out?: string;
  components?: string;
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
};

type ShadcnConfigSnapshot = {
  exists: boolean;
  aliases: Record<string, string>;
  style?: string;
  sourcePath?: string;
};

export type InitResult = {
  outputPath: string;
  code: string;
  wroteFile: boolean;
  usedShadcnDefaults: boolean;
  summary: string;
};

function toPosixPath(value: string): string {
  return value.replace(/\\/g, '/');
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function logStep(step: string): void {
  console.log(step);
}

function logVerbose(verbose: boolean, message: string): void {
  if (verbose) {
    console.log(`  ${message}`);
  }
}

function inferComponentModulePath(snapshot: ShadcnConfigSnapshot): string {
  if (snapshot.aliases['ui']) {
    return `${snapshot.aliases['ui']}/zod-form-components`;
  }

  if (snapshot.aliases['components']) {
    return `${snapshot.aliases['components']}/zod-form-components`;
  }

  return '@/components/zod-form-components';
}

function resolveComponentModulePath(options: InitOptions, snapshot: ShadcnConfigSnapshot): string {
  const explicit = options.components?.trim();
  if (explicit) {
    return explicit;
  }

  return inferComponentModulePath(snapshot);
}

function buildConfigTemplate(modulePath: string): string {
  return [
    `import { defineComponentConfig } from '@zod-to-form/cli';`,
    ``,
    `export default defineComponentConfig({`,
    `  components: '${modulePath}',`,
    `  overwrite: false,`,
    `  types: [],`,
    `  include: [],`,
    `  exclude: [],`,
    `  fieldTypes: {`,
    `    Input: { component: 'Input' },`,
    `    Textarea: { component: 'Textarea' },`,
    `    Select: { component: 'Select' },`,
    `    Checkbox: { component: 'Checkbox' },`,
    `    Switch: { component: 'Switch' },`,
    `    DatePicker: { component: 'DatePicker' },`,
    `    FileInput: { component: 'FileInput' }`,
    `  }`,
    `});`,
    ``
  ].join('\n');
}

async function detectShadcnConfig(cwd: string): Promise<ShadcnConfigSnapshot> {
  const componentsPath = path.join(cwd, 'components.json');
  if (!(await exists(componentsPath))) {
    return {
      exists: false,
      aliases: {}
    };
  }

  try {
    const content = await readFile(componentsPath, 'utf8');
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const aliases =
      parsed['aliases'] &&
      typeof parsed['aliases'] === 'object' &&
      !Array.isArray(parsed['aliases'])
        ? (parsed['aliases'] as Record<string, unknown>)
        : {};

    const stringAliases = Object.fromEntries(
      Object.entries(aliases)
        .filter(([, value]) => typeof value === 'string')
        .map(([key, value]) => [key, value as string])
    );

    return {
      exists: true,
      aliases: stringAliases,
      style: typeof parsed['style'] === 'string' ? parsed['style'] : undefined,
      sourcePath: componentsPath
    };
  } catch {
    return {
      exists: false,
      aliases: {}
    };
  }
}

function resolveOutputPath(cwd: string, out: string | undefined): string {
  if (!out) {
    return path.join(cwd, 'component-config.ts');
  }

  const absolute = path.resolve(cwd, out);
  if (absolute.endsWith('.ts')) {
    return absolute;
  }

  return path.join(absolute, 'component-config.ts');
}

export async function runInit(options: InitOptions): Promise<InitResult> {
  const cwd = process.cwd();
  const verbose = options.verbose ?? false;
  const outputPath = resolveOutputPath(cwd, options.out);

  logStep('[1/4] Detecting project configuration');
  const shadcn = await detectShadcnConfig(cwd);
  logVerbose(verbose, `shadcn components.json found: ${String(shadcn.exists)}`);
  if (shadcn.sourcePath) {
    logVerbose(verbose, `source: ${toPosixPath(path.relative(cwd, shadcn.sourcePath))}`);
  }
  if (Object.keys(shadcn.aliases).length > 0) {
    logVerbose(verbose, `aliases: ${JSON.stringify(shadcn.aliases)}`);
  }

  logStep('[2/4] Building component-config template');
  const modulePath = resolveComponentModulePath(options, shadcn);
  const code = buildConfigTemplate(modulePath);
  logVerbose(verbose, `components import path: ${modulePath}`);

  logStep('[3/4] Validating output target');
  const outputExists = await exists(outputPath);
  if (outputExists && !options.force) {
    const summary = `Skipped: ${toPosixPath(path.relative(cwd, outputPath))} already exists (use --force to overwrite).`;
    console.log(`[summary] ${summary}`);
    return {
      outputPath,
      code,
      wroteFile: false,
      usedShadcnDefaults: shadcn.exists,
      summary
    };
  }

  if (options.dryRun) {
    logStep('[4/4] Dry run (no files written)');
    process.stdout.write(code);
    const summary = `Dry run complete for ${toPosixPath(path.relative(cwd, outputPath))}.`;
    console.log(`\n[summary] ${summary}`);
    return {
      outputPath,
      code,
      wroteFile: false,
      usedShadcnDefaults: shadcn.exists,
      summary
    };
  }

  logStep('[4/4] Writing component config');
  await writeFile(outputPath, code, 'utf8');
  const summary = `Wrote ${toPosixPath(path.relative(cwd, outputPath))}${
    shadcn.exists ? ' using shadcn defaults.' : ' using baseline defaults.'
  }`;
  console.log(`[summary] ${summary}`);

  return {
    outputPath,
    code,
    wroteFile: true,
    usedShadcnDefaults: shadcn.exists,
    summary
  };
}

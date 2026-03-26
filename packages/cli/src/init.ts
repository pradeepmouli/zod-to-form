import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_OVERRIDES } from '@zod-to-form/core';
import { buildConfigSource } from '@zod-to-form/codegen';
import { resolveSchemaExportNames } from './loader.js';

export type InitOptions = {
  out?: string;
  components?: string;
  schemas?: string;
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

function resolveAliasToLocalPath(cwd: string, aliasPath: string): string | undefined {
  if (aliasPath.startsWith('@/')) {
    return path.join(cwd, 'src', aliasPath.slice(2));
  }

  if (aliasPath.startsWith('./') || aliasPath.startsWith('../')) {
    return path.resolve(cwd, aliasPath);
  }

  return undefined;
}

function resolveModuleBasePath(
  cwd: string,
  modulePath: string,
  snapshot: ShadcnConfigSnapshot
): string | undefined {
  if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
    return path.resolve(cwd, modulePath);
  }

  if (modulePath.startsWith('@/')) {
    return path.join(cwd, 'src', modulePath.slice(2));
  }

  for (const aliasValue of Object.values(snapshot.aliases)) {
    if (modulePath === aliasValue || modulePath.startsWith(`${aliasValue}/`)) {
      const aliasLocal = resolveAliasToLocalPath(cwd, aliasValue);
      if (!aliasLocal) {
        continue;
      }

      const suffix = modulePath.slice(aliasValue.length).replace(/^\//, '');
      return suffix.length > 0 ? path.join(aliasLocal, suffix) : aliasLocal;
    }
  }

  return undefined;
}

function getCandidateFiles(basePath: string): string[] {
  return [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.jsx')
  ];
}

function extractExportedNames(code: string): Set<string> {
  const names = new Set<string>();
  const declarationRegex =
    /export\s+(?:const|function|class|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
  const namedExportRegex = /export\s*\{([^}]+)\}/g;

  let declarationMatch: RegExpExecArray | null;
  while ((declarationMatch = declarationRegex.exec(code)) !== null) {
    names.add(declarationMatch[1]!);
  }

  let namedExportMatch: RegExpExecArray | null;
  while ((namedExportMatch = namedExportRegex.exec(code)) !== null) {
    const entries = namedExportMatch[1]!.split(',');
    for (const entry of entries) {
      const normalized = entry.trim();
      if (!normalized) {
        continue;
      }

      const aliasMatch = normalized.match(/^(\w+)\s+as\s+(\w+)$/);
      if (aliasMatch) {
        names.add(aliasMatch[2]!);
        continue;
      }

      names.add(normalized);
    }
  }

  return names;
}

type DiscoveredComponent = {
  name: string;
  controlled: boolean;
};

type DiscoveredComponents = {
  components: DiscoveredComponent[];
  source?: string;
};

/**
 * Well-known shadcn/Radix components that are inherently controlled
 * (they don't accept register() spread — they need value + onChange via Controller).
 */
const KNOWN_CONTROLLED_COMPONENTS = new Set([
  'Select',
  'Combobox',
  'Slider',
  'Switch',
  'RadioGroup',
  'ToggleGroup',
  'DatePicker',
  'Calendar',
  'ColorPicker'
]);

/**
 * Heuristic: a component is likely controlled if its source exports accept
 * `value` and `onChange` props but does NOT use `forwardRef` (which would
 * indicate it can accept a ref from register()).
 */
/**
 * @param code Full file source
 * @param name Component name to check
 * @param lines Pre-split lines of `code` (avoids re-splitting per component)
 */
function detectControlledFromSource(code: string, name: string, lines: string[]): boolean {
  // Check if this specific component's definition mentions value/onChange props
  const propsPattern = new RegExp(
    `(?:type|interface)\\s+${name}Props[^{]*\\{[^}]*value[^}]*onChange`,
    's'
  );
  const funcPattern1 = new RegExp(
    `function\\s+${name}\\s*\\(\\s*\\{[^}]*\\bvalue\\b[^}]*\\bonChange\\b`,
    's'
  );
  const funcPattern2 = new RegExp(
    `function\\s+${name}\\s*\\(\\s*\\{[^}]*\\bonChange\\b[^}]*\\bvalue\\b`,
    's'
  );
  const constPattern = new RegExp(
    `const\\s+${name}\\s*=\\s*(?:React\\.)?(?:forwardRef|memo)?\\s*\\(?` +
      `\\s*(?:function)?\\s*\\(?\\s*\\{[^}]*\\bvalue\\b[^}]*\\bonChange\\b`,
    's'
  );

  const hasValueOnChange =
    propsPattern.test(code) ||
    funcPattern1.test(code) ||
    funcPattern2.test(code) ||
    constPattern.test(code);
  if (!hasValueOnChange) return false;

  // If it uses forwardRef, it can accept a ref from register() — not necessarily controlled.
  const usesForwardRef = lines.some(
    (line) => line.includes(name) && /(?:React\.)?forwardRef/.test(line)
  );
  return !usesForwardRef;
}

type DiscoveredSchemas = {
  exports: string[];
  schemaPath?: string;
};

const EXCLUDED_EXPORT_PREFIXES = ['use', 'create', 'with', 'get', 'set', 'is', 'has'];

function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

async function discoverComponents(
  cwd: string,
  modulePath: string,
  snapshot: ShadcnConfigSnapshot,
  verbose: boolean
): Promise<DiscoveredComponents> {
  const basePath = resolveModuleBasePath(cwd, modulePath, snapshot);
  if (!basePath) {
    logVerbose(verbose, `could not resolve components path: ${modulePath}`);
    return { components: [] };
  }

  const primitiveNames = new Set<string>();

  const componentMap = new Map<string, boolean>();
  let source: string | undefined;

  for (const filePath of getCandidateFiles(basePath)) {
    if (!(await exists(filePath))) {
      continue;
    }

    try {
      const code = await readFile(filePath, 'utf8');
      const fileExports = extractExportedNames(code);
      // Pre-split lines once per file for forwardRef detection
      let lines: string[] | undefined;
      for (const name of fileExports) {
        if (
          isPascalCase(name) &&
          !primitiveNames.has(name) &&
          !EXCLUDED_EXPORT_PREFIXES.some((prefix) => name.startsWith(prefix))
        ) {
          if (!lines) lines = code.split('\n');
          const isControlled =
            KNOWN_CONTROLLED_COMPONENTS.has(name) || detectControlledFromSource(code, name, lines);
          componentMap.set(name, isControlled);
          if (isControlled) {
            logVerbose(verbose, `detected ${name} as controlled component`);
          }
        }
      }
      if (!source && fileExports.size > 0) {
        source = toPosixPath(path.relative(cwd, filePath));
      }
      logVerbose(
        verbose,
        `scanned component exports from ${toPosixPath(path.relative(cwd, filePath))}`
      );
    } catch (err) {
      logVerbose(
        verbose,
        `skipping unreadable component file: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const components = Array.from(componentMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, controlled]) => ({ name, controlled }));

  return { components, source };
}

const SCHEMA_CANDIDATE_PATHS = [
  'src/schemas/index',
  'src/schemas',
  'src/lib/schemas',
  'schemas/index',
  'schemas'
];

async function discoverSchemas(
  cwd: string,
  explicitPath: string | undefined,
  verbose: boolean
): Promise<DiscoveredSchemas> {
  if (explicitPath) {
    const resolved = path.resolve(cwd, explicitPath);
    try {
      const exports = await resolveSchemaExportNames(resolved);
      logVerbose(verbose, `found ${String(exports.length)} schemas in ${explicitPath}`);
      return { exports, schemaPath: toPosixPath(path.relative(cwd, resolved)) };
    } catch (err) {
      console.warn(
        `Warning: Could not load schemas from ${explicitPath}: ${err instanceof Error ? err.message : String(err)}`
      );
      return { exports: [] };
    }
  }

  for (const candidateBase of SCHEMA_CANDIDATE_PATHS) {
    for (const filePath of getCandidateFiles(path.resolve(cwd, candidateBase))) {
      if (!(await exists(filePath))) {
        continue;
      }

      try {
        const exports = await resolveSchemaExportNames(filePath);
        if (exports.length > 0) {
          const relativePath = toPosixPath(path.relative(cwd, filePath));
          logVerbose(verbose, `found ${String(exports.length)} schemas in ${relativePath}`);
          return { exports, schemaPath: relativePath };
        }
      } catch (err) {
        logVerbose(
          verbose,
          `skipping unloadable schema candidate: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  logVerbose(verbose, 'no schema files discovered');
  return { exports: [] };
}

function resolveComponentEntries(
  discoveredComponents: DiscoveredComponents,
  preset: 'shadcn' | 'html' | undefined
): DiscoveredComponent[] {
  if (preset) {
    // When a preset is active, only return discovered (non-preset) components.
    // The preset entries come via the spread in the template.
    return discoveredComponents.components;
  }

  // No preset: merge default entries with any discovered components as fallback
  const presetNames = Object.keys(DEFAULT_OVERRIDES);
  if (discoveredComponents.components.length > 0) {
    const discoveredNames = new Set(discoveredComponents.components.map((c) => c.name));
    const defaults: DiscoveredComponent[] = presetNames
      .filter((name) => !discoveredNames.has(name))
      .map((name) => ({ name, controlled: false }));
    return [...defaults, ...discoveredComponents.components].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  return presetNames.map((name) => ({ name, controlled: false }));
}

function toImportSpecifierFromAbsolute(outputPath: string, absoluteTargetPath: string): string {
  const relativePath = toPosixPath(path.relative(path.dirname(outputPath), absoluteTargetPath));
  const specifier = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;

  if (specifier.endsWith('.tsx') || specifier.endsWith('.jsx')) {
    return `${specifier.slice(0, -4)}.js`;
  }

  if (specifier.endsWith('.ts')) {
    return `${specifier.slice(0, -3)}.js`;
  }

  return specifier;
}

function resolveComponentTypeImportSpecifier(
  cwd: string,
  outputPath: string,
  modulePath: string,
  explicitModulePath: string | undefined
): string {
  const importPath = explicitModulePath?.trim() || modulePath;

  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return toImportSpecifierFromAbsolute(outputPath, path.resolve(cwd, importPath));
  }

  return importPath;
}

function resolveSchemaTypeImportSpecifier(
  cwd: string,
  outputPath: string,
  schemaPath: string | undefined,
  explicitSchemaPath: string | undefined
): string | undefined {
  const importPath = explicitSchemaPath?.trim() || schemaPath;

  if (!importPath) {
    return undefined;
  }

  return toImportSpecifierFromAbsolute(outputPath, path.resolve(cwd, importPath));
}

function buildConfigTemplate(
  cwd: string,
  outputPath: string,
  modulePath: string,
  explicitModulePath: string | undefined,
  componentEntries: DiscoveredComponent[],
  discoveredSchemas: DiscoveredSchemas,
  explicitSchemaPath: string | undefined,
  preset: 'shadcn' | 'html' | undefined
): string {
  const componentsImportPath = resolveComponentTypeImportSpecifier(
    cwd,
    outputPath,
    modulePath,
    explicitModulePath
  );
  const schemaImportPath = resolveSchemaTypeImportSpecifier(
    cwd,
    outputPath,
    discoveredSchemas.schemaPath,
    explicitSchemaPath
  );

  const overrides: Record<string, { controlled?: boolean }> = {};
  for (const entry of componentEntries) {
    if (entry.controlled) {
      overrides[entry.name] = { controlled: true };
    }
  }

  return buildConfigSource({
    componentSource: modulePath,
    componentTypeImport: componentsImportPath,
    schemaTypeImport: schemaImportPath,
    schemaExports: discoveredSchemas.exports,
    preset,
    overrides,
    defaults: {
      mode: 'submit',
      ui: 'shadcn',
      overwrite: false,
      serverAction: false,
      formProvider: false
    }
  });
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
  } catch (err) {
    if (await exists(path.join(cwd, 'components.json'))) {
      console.warn(
        `Warning: Found components.json but could not parse it: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return {
      exists: false,
      aliases: {}
    };
  }
}

function resolveOutputPath(cwd: string, out: string | undefined): string {
  if (!out) {
    return path.join(cwd, 'z2f.config.ts');
  }

  const absolute = path.resolve(cwd, out);
  if (absolute.endsWith('.ts')) {
    return absolute;
  }

  return path.join(absolute, 'z2f.config.ts');
}

export async function runInit(options: InitOptions): Promise<InitResult> {
  const cwd = process.cwd();
  const verbose = options.verbose ?? false;
  const outputPath = resolveOutputPath(cwd, options.out);

  console.log('[1/5] Detecting project configuration');
  const shadcn = await detectShadcnConfig(cwd);
  logVerbose(verbose, `shadcn components.json found: ${String(shadcn.exists)}`);
  if (shadcn.sourcePath) {
    logVerbose(verbose, `source: ${toPosixPath(path.relative(cwd, shadcn.sourcePath))}`);
  }
  if (Object.keys(shadcn.aliases).length > 0) {
    logVerbose(verbose, `aliases: ${JSON.stringify(shadcn.aliases)}`);
  }

  console.log('[2/5] Discovering components');
  const modulePath = resolveComponentModulePath(options, shadcn);
  const discoveredComponents = await discoverComponents(cwd, modulePath, shadcn, verbose);
  logVerbose(verbose, `components import path: ${modulePath}`);

  console.log('\nDetected components:');

  if (discoveredComponents.components.length > 0) {
    console.log('\nDiscovered field types:');
    for (const comp of discoveredComponents.components) {
      const tag = comp.controlled ? ' (controlled)' : '';
      console.log(`  \u2713 ${comp.name}${tag}`);
    }
  } else {
    console.log('\nUsing default field types (no components discovered)');
  }

  console.log(`\nUsing components from: ${modulePath}`);

  console.log('[3/5] Discovering schemas');
  const discoveredSchemas = await discoverSchemas(cwd, options.schemas, verbose);

  if (discoveredSchemas.exports.length > 0) {
    console.log('\nDiscovered schemas:');
    for (const name of discoveredSchemas.exports) {
      console.log(`  \u2713 ${name}`);
    }
    if (discoveredSchemas.schemaPath) {
      console.log(`Using schemas from: ${discoveredSchemas.schemaPath}`);
    }
  } else {
    console.log('\nNo schemas discovered (use --schemas <path> to specify)');
  }

  console.log('[4/5] Building config template');
  const preset = shadcn.exists ? ('shadcn' as const) : undefined;
  const componentEntries = resolveComponentEntries(discoveredComponents, preset);
  const code = buildConfigTemplate(
    cwd,
    outputPath,
    modulePath,
    options.components,
    componentEntries,
    discoveredSchemas,
    options.schemas,
    preset
  );

  console.log('[5/5] Validating output target');
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
    console.log('Dry run (no files written)');
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

  console.log('Writing component config');
  await mkdir(path.dirname(outputPath), { recursive: true });
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

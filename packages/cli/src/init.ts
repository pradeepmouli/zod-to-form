import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_FIELD_TYPES } from '@zod-to-form/core';
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

type FormPrimitivesConfig = {
  field: string;
  label: string;
  control: string;
};

type DiscoveredFormPrimitives = {
  primitives: FormPrimitivesConfig;
  sources: string[];
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

async function discoverFormPrimitives(
  cwd: string,
  modulePath: string,
  snapshot: ShadcnConfigSnapshot,
  verbose: boolean
): Promise<DiscoveredFormPrimitives> {
  const defaults: FormPrimitivesConfig = {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FieldControl'
  };

  const candidateModules: string[] = [modulePath];
  if (snapshot.aliases['ui']) {
    candidateModules.push(`${snapshot.aliases['ui']}/field`);
  }

  const exportedNames = new Set<string>();
  const sourceByExport = new Map<string, string>();

  for (const candidateModule of candidateModules) {
    const basePath = resolveModuleBasePath(cwd, candidateModule, snapshot);
    if (!basePath) {
      continue;
    }

    for (const filePath of getCandidateFiles(basePath)) {
      if (!(await exists(filePath))) {
        continue;
      }

      try {
        const code = await readFile(filePath, 'utf8');
        const fileExports = extractExportedNames(code);
        for (const name of fileExports) {
          exportedNames.add(name);
          if (!sourceByExport.has(name)) {
            sourceByExport.set(name, toPosixPath(path.relative(cwd, filePath)));
          }
        }
        logVerbose(verbose, `scanned exports from ${toPosixPath(path.relative(cwd, filePath))}`);
      } catch {
        // ignore unreadable candidates and continue with defaults/other candidates
      }
    }
  }

  const field = exportedNames.has('Field')
    ? 'Field'
    : exportedNames.has('FormField')
      ? 'FormField'
      : defaults.field;

  const label = exportedNames.has('FieldLabel')
    ? 'FieldLabel'
    : exportedNames.has('FormLabel')
      ? 'FormLabel'
      : exportedNames.has('Label')
        ? 'Label'
        : defaults.label;

  const control = exportedNames.has('FieldControl')
    ? 'FieldControl'
    : exportedNames.has('FormControl')
      ? 'FormControl'
      : defaults.control;

  const sources = Array.from(
    new Set([
      sourceByExport.get(field),
      sourceByExport.get(label),
      sourceByExport.get(control)
    ]).values()
  ).filter((value): value is string => typeof value === 'string');

  return {
    primitives: { field, label, control },
    sources
  };
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
  formPrimitives: FormPrimitivesConfig,
  verbose: boolean
): Promise<DiscoveredComponents> {
  const basePath = resolveModuleBasePath(cwd, modulePath, snapshot);
  if (!basePath) {
    logVerbose(verbose, `could not resolve components path: ${modulePath}`);
    return { components: [] };
  }

  const primitiveNames = new Set([
    formPrimitives.field,
    formPrimitives.label,
    formPrimitives.control
  ]);

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
    } catch {
      // ignore unreadable files
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
    } catch {
      logVerbose(verbose, `could not load schemas from ${explicitPath}`);
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
      } catch {
        // ignore unloadable candidates
      }
    }
  }

  logVerbose(verbose, 'no schema files discovered');
  return { exports: [] };
}

const PRESET_IMPORT_NAME: Record<string, string> = {
  shadcn: 'SHADCN_FIELD_TYPES',
  unstyled: 'DEFAULT_FIELD_TYPES'
};

function resolveFieldTypeEntries(
  discoveredComponents: DiscoveredComponents,
  preset: 'shadcn' | 'unstyled' | undefined
): DiscoveredComponent[] {
  if (preset) {
    // When a preset is active, only return discovered (non-preset) components.
    // The preset entries come via the spread in the template.
    return discoveredComponents.components;
  }

  // No preset: merge default entries with any discovered components as fallback
  const presetNames = Object.keys(DEFAULT_FIELD_TYPES);
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

function buildConfigTemplate(
  modulePath: string,
  formPrimitives: FormPrimitivesConfig,
  fieldTypeEntries: DiscoveredComponent[],
  discoveredSchemas: DiscoveredSchemas,
  preset: 'shadcn' | 'unstyled' | undefined
): string {
  const presetImportName = preset ? PRESET_IMPORT_NAME[preset] : undefined;

  // Build import line
  const importNames = ['defineConfig'];
  if (presetImportName) {
    importNames.push(presetImportName);
  }

  // Build fieldTypes entries
  const fieldTypeLines: string[] = [];
  if (presetImportName) {
    const comma = fieldTypeEntries.length > 0 ? ',' : '';
    fieldTypeLines.push(`    ...${presetImportName}${comma}`);
  }
  fieldTypeEntries.forEach((entry, i) => {
    const comma = i < fieldTypeEntries.length - 1 ? ',' : '';
    if (entry.controlled) {
      fieldTypeLines.push(
        `    ${entry.name}: { component: '${entry.name}', controlled: true }${comma}`
      );
    } else {
      fieldTypeLines.push(`    ${entry.name}: { component: '${entry.name}' }${comma}`);
    }
  });

  const lines = [
    `import { ${importNames.join(', ')} } from '@zod-to-form/core';`,
    ``,
    `export default defineConfig({`,
    `  components: '${modulePath}',`
  ];

  if (preset) {
    lines.push(`  preset: '${preset}',`);
  }

  lines.push(
    `  formPrimitives: {`,
    `    field: '${formPrimitives.field}',`,
    `    label: '${formPrimitives.label}',`,
    `    control: '${formPrimitives.control}'`,
    `  },`,
    `  defaults: {`,
    `    mode: 'submit',`,
    `    ui: 'shadcn',`,
    `    overwrite: false,`,
    `    serverAction: false,`,
    `    formProvider: false`,
    `  },`,
    `  include: [],`,
    `  exclude: [],`,
    `  fieldTypes: {`,
    ...fieldTypeLines,
    `  }`
  );

  if (discoveredSchemas.exports.length > 0) {
    lines[lines.length - 1] += ',';
    lines.push(`  schemas: {`);
    for (let i = 0; i < discoveredSchemas.exports.length; i++) {
      const name = discoveredSchemas.exports[i];
      const comma = i < discoveredSchemas.exports.length - 1 ? ',' : '';
      lines.push(`    ${name}: {}${comma}`);
    }
    lines.push(`  }`);
  }

  lines.push(`});`);
  lines.push(``);

  return lines.join('\n');
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

  logStep('[1/5] Detecting project configuration');
  const shadcn = await detectShadcnConfig(cwd);
  logVerbose(verbose, `shadcn components.json found: ${String(shadcn.exists)}`);
  if (shadcn.sourcePath) {
    logVerbose(verbose, `source: ${toPosixPath(path.relative(cwd, shadcn.sourcePath))}`);
  }
  if (Object.keys(shadcn.aliases).length > 0) {
    logVerbose(verbose, `aliases: ${JSON.stringify(shadcn.aliases)}`);
  }

  logStep('[2/5] Discovering components');
  const modulePath = resolveComponentModulePath(options, shadcn);
  const discoveredPrimitives = await discoverFormPrimitives(cwd, modulePath, shadcn, verbose);
  const discoveredComponents = await discoverComponents(
    cwd,
    modulePath,
    shadcn,
    discoveredPrimitives.primitives,
    verbose
  );
  logVerbose(verbose, `components import path: ${modulePath}`);
  logVerbose(verbose, `formPrimitives: ${JSON.stringify(discoveredPrimitives.primitives)}`);
  if (discoveredPrimitives.sources.length > 0) {
    logVerbose(verbose, `formPrimitives source: ${discoveredPrimitives.sources.join(', ')}`);
  } else {
    logVerbose(verbose, `formPrimitives source: defaults`);
  }

  // Styled autodiscovery output
  const p = discoveredPrimitives.primitives;
  console.log('\nDetected components:');
  console.log(`  \u2713 Field \u2192 ${p.field}`);
  console.log(`  \u2713 Label \u2192 ${p.label}`);
  console.log(`  \u2713 Control \u2192 ${p.control}`);

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

  logStep('[3/5] Discovering schemas');
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

  logStep('[4/5] Building config template');
  const preset = shadcn.exists ? ('shadcn' as const) : undefined;
  const fieldTypeEntries = resolveFieldTypeEntries(discoveredComponents, preset);
  const code = buildConfigTemplate(
    modulePath,
    discoveredPrimitives.primitives,
    fieldTypeEntries,
    discoveredSchemas,
    preset
  );

  logStep('[5/5] Validating output target');
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
    logStep('Dry run (no files written)');
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

  logStep('Writing component config');
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

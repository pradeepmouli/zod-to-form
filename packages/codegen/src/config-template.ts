/**
 * Browser-safe config template generator.
 * Produces the defineConfig({...}) source string used by both the CLI
 * init command and the playground.
 */

export type ConfigTemplateOptions = {
  /** Component module import path (e.g. './components/ui') */
  componentSource: string;
  /** Component type import specifier for generics (e.g. './components/ui') */
  componentTypeImport?: string;
  /** Schema type import specifier (e.g. './schema') */
  schemaTypeImport?: string;
  /** Schema export names for the schemas block */
  schemaExports?: string[];
  /** Preset name: 'shadcn' | 'html' */
  preset?: 'shadcn' | 'html';
  /** Component overrides (name → { controlled?: boolean; props?: ... }) */
  overrides?: Record<
    string,
    {
      controlled?: boolean;
      props?: Record<string, string | number | boolean | null>;
    }
  >;
  /** Defaults block */
  defaults?: {
    mode?: 'submit' | 'auto-save';
    ui?: 'shadcn' | 'html';
    overwrite?: boolean;
    serverAction?: boolean;
    formProvider?: boolean;
    optimization?: { level?: 1 | 2 | 3 };
  };
  /** Per-field overrides */
  fields?: Record<string, Record<string, unknown>>;
};

const PRESET_IMPORT_NAME: Record<string, string> = {
  shadcn: 'SHADCN_OVERRIDES',
  html: 'DEFAULT_OVERRIDES'
};

function renderLiteral(value: string | number | boolean | null): string {
  if (typeof value === 'string') {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  return JSON.stringify(value);
}

/**
 * Generate a `z2f.config.ts` starter file as a source string.
 * Produces a `defineConfig(...)` call with components, defaults, include/exclude,
 * optional fields, and schemas blocks based on the provided options.
 *
 * @param opts - Template options controlling the generated config structure.
 * @returns The complete config file source as a string, ready to write to disk.
 *
 * @example
 * ```ts
 * const source = buildConfigSource({ componentSource: './components/ui', preset: 'shadcn' });
 * await fs.writeFile('z2f.config.ts', source);
 * ```
 *
 * @remarks
 * The generated file uses TypeScript generics for full type inference:
 * `defineConfig<typeof Components, typeof ZodSchemas>(...)`.
 * Preset-specific overrides (e.g. `SHADCN_OVERRIDES`) are spread into the overrides block.
 *
 * @category Config Templates
 */
export function buildConfigSource(opts: ConfigTemplateOptions): string {
  const preset = opts.preset;
  const presetImportName = preset ? PRESET_IMPORT_NAME[preset] : undefined;

  // Imports
  const importNames = ['defineConfig'];
  if (presetImportName) importNames.push(presetImportName);

  const lines: string[] = [`import { ${importNames.join(', ')} } from '@zod-to-form/core';`];

  const componentTypeImport = opts.componentTypeImport ?? opts.componentSource;
  lines.push('');
  lines.push(`import type * as Components from '${componentTypeImport}';`);

  if (opts.schemaTypeImport) {
    lines.push(`import type * as ZodSchemas from '${opts.schemaTypeImport}';`);
  }

  // defineConfig opening
  const hasSchemas = opts.schemaTypeImport || (opts.schemaExports && opts.schemaExports.length > 0);
  const generics = hasSchemas ? '<typeof Components, typeof ZodSchemas>' : '<typeof Components>';
  lines.push('');
  lines.push(`export default defineConfig${generics}({`);

  // components block
  lines.push(`  components: {`);
  lines.push(`    source: '${opts.componentSource}',`);
  if (preset) {
    lines.push(`    preset: '${preset}',`);
  }

  // overrides — serialize ALL entries (controlled and non-controlled).
  // A non-controlled/empty entry emits `Name: {}` (use the named component from
  // source for this field); a controlled entry emits `Name: { controlled: true }`.
  // When present, `props` are serialized into `props: { ... }`.
  // Dropping non-controlled entries previously caused fields without an override
  // to regress to raw `<input>` on regeneration.
  const overrideEntries = opts.overrides ? Object.entries(opts.overrides) : [];
  if (presetImportName || overrideEntries.length > 0) {
    lines.push(`    overrides: {`);
    if (presetImportName) {
      const comma = overrideEntries.length > 0 ? ',' : '';
      lines.push(`      ...${presetImportName}${comma}`);
    }
    overrideEntries.forEach(([name, v], i) => {
      const comma = i < overrideEntries.length - 1 ? ',' : '';
      const tokens: string[] = [];
      if (v.controlled) tokens.push('controlled: true');
      if (v.props && Object.keys(v.props).length > 0) {
        const renderedProps = Object.entries(v.props)
          .map(([k, value]) => `${k}: ${renderLiteral(value)}`)
          .join(', ');
        tokens.push(`props: { ${renderedProps} }`);
      }
      const body = tokens.length > 0 ? `{ ${tokens.join(', ')} }` : '{}';
      lines.push(`      ${name}: ${body}${comma}`);
    });
    lines.push(`    }`);
  }
  lines.push(`  },`);

  // defaults block
  const defaults = {
    mode: 'submit',
    ui: preset === 'shadcn' ? 'shadcn' : 'html',
    overwrite: false,
    serverAction: false,
    formProvider: false,
    ...opts.defaults
  };
  lines.push(`  defaults: {`);
  lines.push(`    mode: '${defaults.mode}',`);
  lines.push(`    ui: '${defaults.ui}',`);
  lines.push(`    overwrite: ${defaults.overwrite},`);
  lines.push(`    serverAction: ${defaults.serverAction},`);
  lines.push(`    formProvider: ${defaults.formProvider},`);
  if (defaults.optimization?.level) {
    lines.push(`    optimization: { level: ${defaults.optimization.level} }`);
  } else {
    lines.push(
      `    // optimization: { level: 2 }  // 1 = decompose, 2 = native rules, 3 = cross-field`
    );
  }
  lines.push(`  },`);

  // include/exclude
  lines.push(`  include: [],`);

  // fields block
  const fieldEntries = opts.fields
    ? Object.entries(opts.fields).filter(([, v]) => {
        return v && Object.values(v).some((val) => val !== undefined);
      })
    : [];

  if (fieldEntries.length > 0) {
    lines.push(`  exclude: [],`);
    lines.push(`  fields: {`);
    fieldEntries.forEach(([key, config], i) => {
      const props = Object.entries(config)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(', ');
      const comma = i < fieldEntries.length - 1 ? ',' : '';
      lines.push(`    '${key}': { ${props} }${comma}`);
    });
    lines.push(`  }`);
  } else {
    lines.push(`  exclude: []`);
  }

  // schemas block
  const schemaExports = opts.schemaExports ?? [];
  if (schemaExports.length > 0) {
    lines[lines.length - 1] += ',';
    lines.push(`  schemas: {`);
    schemaExports.forEach((name, i) => {
      const comma = i < schemaExports.length - 1 ? ',' : '';
      lines.push(`    ${name}: {}${comma}`);
    });
    lines.push(`  }`);
  }

  lines.push(`});`);
  lines.push('');

  return lines.join('\n');
}

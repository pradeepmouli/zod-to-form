import { PRESET_MAP, resolveFieldConfig, validateConfig } from './config.js';
import type { ConfigPatch, OptimizationConfig, ZodFormsConfig, ZodTypeConfig } from './config.js';

export type ConfigInvocation = {
  name?: string;
  mode?: 'submit' | 'auto-save';
  ui?: 'shadcn' | 'html';
  out?: string;
  serverAction?: boolean;
};

export type ResolvedFormConfig = {
  componentConfig: ZodFormsConfig;
  componentName: string;
  mode: 'submit' | 'auto-save';
  ui: 'shadcn' | 'html';
  out?: string;
  overwrite: boolean;
  serverAction: boolean;
  formProvider: boolean;
  optimization: OptimizationConfig;
  fields: NonNullable<ZodFormsConfig['fields']>;
};

/** Merge authored layers without expanding presets. Arrays and props replace. */
export function mergeConfigLayers(...layers: ConfigPatch[]): ZodFormsConfig {
  let merged: ConfigPatch = {};
  for (const layer of layers) {
    const schemas = { ...merged.schemas };
    for (const [name, schema] of Object.entries(layer.schemas ?? {})) {
      if (!schema) continue;
      const previous = schemas[name] as ZodTypeConfig | undefined;
      Object.defineProperty(schemas, name, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: {
          ...previous,
          ...schema,
          fields: resolveFieldConfig(previous?.fields, schema.fields)
        }
      });
    }
    merged = {
      ...merged,
      ...layer,
      components: {
        ...merged.components,
        ...layer.components,
        overrides: { ...merged.components?.overrides, ...layer.components?.overrides }
      },
      defaults: {
        ...merged.defaults,
        ...layer.defaults,
        optimization: { ...merged.defaults?.optimization, ...layer.defaults?.optimization }
      },
      fields: resolveFieldConfig(merged.fields, layer.fields),
      schemas
    };
  }
  return validateConfig(merged);
}

/** Resolve one root export from the canonical config and optional variant. */
export function resolveFormConfig({
  config,
  exportName,
  variant,
  invocation = {}
}: {
  config: ZodFormsConfig;
  exportName: string;
  variant?: string;
  invocation?: ConfigInvocation;
}): ResolvedFormConfig {
  const validated = validateConfig(config);
  const { variants, ...base } = validated;
  if (variant && !Object.hasOwn(variants ?? {}, variant)) {
    throw new Error(
      `Unknown variant "${variant}". Available variants: ${Object.keys(variants ?? {}).join(', ') || '(none)'}`
    );
  }
  const authored = mergeConfigLayers(base, variant ? variants![variant]! : {});
  const preset = authored.components.preset;
  const componentConfig = {
    ...authored,
    components: {
      ...authored.components,
      overrides: { ...(preset ? PRESET_MAP[preset] : {}), ...authored.components.overrides }
    }
  };
  const defaults = authored.defaults;
  const schema = authored.schemas?.[exportName];
  return {
    componentConfig,
    componentName:
      invocation.name ??
      schema?.name ??
      `${exportName
        .replace(/Schema$/, '')
        .split(/[^a-zA-Z0-9]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')}Form`,
    mode: invocation.mode ?? schema?.mode ?? defaults?.mode ?? 'submit',
    ui: invocation.ui ?? defaults?.ui ?? 'shadcn',
    out: invocation.out ?? schema?.out ?? defaults?.out,
    overwrite: defaults?.overwrite ?? false,
    serverAction:
      invocation.serverAction ?? schema?.serverAction ?? defaults?.serverAction ?? false,
    formProvider: defaults?.formProvider ?? false,
    optimization: { ...defaults?.optimization },
    fields: resolveFieldConfig(authored.fields, schema?.fields)
  };
}

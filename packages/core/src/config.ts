import { z } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import type { FieldConfig } from './types.js';

// ─── Component Override ───────────────────────────────────────────────

/** Per-component metadata override. Only components that differ from defaults need an entry. */
export type ComponentOverride = {
  /** When true, use Controller/useController instead of register() spread */
  controlled?: boolean;
  /**
   * Default props for this component type.
   * Values matching a known field expression string are resolved from the RHF controller.
   * Per-field props override these via shallow merge (field config wins).
   */
  props?: Record<string, unknown>;
};

// ─── Components Config ────────────────────────────────────────────────

export type ComponentPreset = 'shadcn' | 'html';

export type ComponentsConfig<T extends Record<string, unknown> = Record<string, unknown>> = {
  /** Import path for the components module */
  source: string;
  /** Preset that provides base overrides and default field template */
  preset?: ComponentPreset;
  /**
   * Custom field template component path.
   * Controls the composition of label + input + description + helpText + error.
   * Overrides the preset's default template.
   */
  fieldTemplate?: string;
  /** Per-component overrides, strongly typed to module export keys */
  overrides?: { [K in keyof T & string]?: ComponentOverride };
};

// ─── Typed Field Config ──────────────────────────────────────────────

/** Field config with props constrained to a specific component's prop type */
type TypedFieldConfigForComponent<
  TComponents extends Record<string, unknown>,
  K extends keyof TComponents & string
> = Omit<FieldConfig, 'component' | 'props'> & {
  component: K;
  props?: TComponents[K] extends Record<string, unknown>
    ? Partial<TComponents[K]>
    : Record<string, unknown>;
};

/** Field config with no component specified (untyped props) */
type UntypedFieldConfig = Omit<FieldConfig, 'component'> & {
  component?: undefined;
};

/**
 * Discriminated union over component keys.
 * When `component` is set to a known component key, `props` is constrained
 * to that component's prop type. When `component` is omitted, `props` is
 * an open `Record<string, unknown>`.
 */
export type TypedFieldConfig<
  TComponents extends Record<string, unknown> = Record<string, unknown>
> =
  | {
      [K in keyof TComponents & string]: TypedFieldConfigForComponent<TComponents, K>;
    }[keyof TComponents & string]
  | UntypedFieldConfig;

// ─── Config Types ────────────────────────────────────────────────────

export type ConfigDefaults = {
  mode?: 'submit' | 'auto-save';
  ui?: 'shadcn' | 'html';
  out?: string;
  overwrite?: boolean;
  serverAction?: boolean;
  /** Wrap generated form in <FormProvider {...form}> */
  formProvider?: boolean;
};

export type ZodTypeConfig<
  TFieldKeys extends string = string,
  TComponents extends Record<string, unknown> = Record<string, unknown>
> = {
  name?: string;
  mode?: 'submit' | 'auto-save';
  out?: string;
  serverAction?: boolean;
  fields?: Partial<Record<TFieldKeys, TypedFieldConfig<TComponents>>>;
};

export type ZodFormsConfig<
  TComponents extends Record<string, unknown> = Record<string, unknown>,
  TSchemas extends Record<string, unknown> = Record<string, unknown>
> = {
  components: ComponentsConfig<TComponents>;
  defaults?: ConfigDefaults;
  types?: string[];
  include?: string[];
  exclude?: string[];
  fields?: Record<string, TypedFieldConfig<TComponents>>;
  schemas?: {
    [K in keyof TSchemas & string]?: ZodTypeConfig<
      TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string,
      TComponents
    >;
  };
};

// ─── Utility Types ───────────────────────────────────────────────────

/**
 * Strips index signatures from a type, keeping only explicitly declared keys.
 * Useful for Zod's `z.output<>` which adds `[x: string]: unknown` index signatures.
 */
export type StripIndexSignature<T> = T extends readonly (infer U)[]
  ? StripIndexSignature<U>[]
  : T extends object
    ? {
        [K in keyof T as string extends K
          ? never
          : number extends K
            ? never
            : symbol extends K
              ? never
              : K]: StripIndexSignature<T[K]>;
      }
    : T;

// ─── Path Utilities ──────────────────────────────────────────────────

type Primitive = string | number | boolean | bigint | symbol | null | undefined | Date;

type DotPath<T> = T extends Primitive
  ? never
  : T extends readonly (infer TItem)[]
    ? `${number}` | `${number}.${DotPath<TItem>}`
    : {
        [TKey in Extract<keyof T, string>]: T[TKey] extends Primitive
          ? TKey
          : TKey | `${TKey}.${DotPath<T[TKey]>}`;
      }[Extract<keyof T, string>];

type NormalizeArrayPath<TPath extends string> =
  TPath extends `${infer Prefix}.${number}.${infer Suffix}`
    ? NormalizeArrayPath<`${Prefix}[].${Suffix}`>
    : TPath extends `${infer Prefix}.${number}`
      ? NormalizeArrayPath<`${Prefix}[]`>
      : TPath;

type FieldPath<TValues extends Record<string, unknown>> =
  DotPath<TValues> extends infer TPath
    ? TPath extends string
      ? TPath | NormalizeArrayPath<TPath>
      : never
    : never;

/** Extracts dot-notation field paths from a Zod schema's inferred type */
type SchemaFieldPath<T extends $ZodType> =
  z.infer<T> extends infer O ? (O extends Record<string, unknown> ? FieldPath<O> : string) : string;

// ─── Validation Schemas ───────────────────────────────────────────────

const nonEmptyStringSchema = z.string().trim().min(1);

const componentOverrideSchema = z
  .object({
    controlled: z.boolean().optional(),
    props: z.record(z.string(), z.unknown()).optional()
  })
  .loose();

const componentsConfigSchema = z
  .object({
    source: nonEmptyStringSchema,
    preset: z.enum(['shadcn', 'html']).optional(),
    fieldTemplate: nonEmptyStringSchema.optional(),
    overrides: z.record(z.string(), componentOverrideSchema).optional()
  })
  .loose();

const fieldConfigSchema = z
  .object({
    component: nonEmptyStringSchema.optional(),
    order: z.number().optional(),
    hidden: z.boolean().optional(),
    disabled: z.boolean().optional(),
    props: z.record(z.string(), z.unknown()).optional(),
    section: z.string().optional(),
    helpText: z.string().optional()
  })
  .loose();

const fieldOverrideSchema = z
  .object({
    component: nonEmptyStringSchema,
    props: z.record(z.string(), z.unknown()).optional()
  })
  .loose();

const defaultsSchema = z
  .object({
    mode: z.string().optional(),
    ui: z.string().optional(),
    out: z.string().optional(),
    overwrite: z.boolean().optional(),
    serverAction: z.boolean().optional(),
    formProvider: z.boolean().optional()
  })
  .loose()
  .optional();

const zodTypeConfigSchema = z
  .object({
    name: z.string().optional(),
    mode: z.string().optional(),
    out: z.string().optional(),
    serverAction: z.boolean().optional(),
    fields: z.record(z.string(), fieldConfigSchema).optional()
  })
  .loose();

const configSchema = z
  .object({
    components: componentsConfigSchema,
    overwrite: z.boolean().optional(),
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    types: z.array(z.string()).optional(),
    fields: z.record(z.string(), fieldOverrideSchema.or(fieldConfigSchema)).optional(),
    defaults: defaultsSchema,
    schemas: z.record(z.string(), zodTypeConfigSchema).optional()
  })
  .loose();

// ─── Error Formatting ─────────────────────────────────────────────────

function formatValidationError(error: z.ZodError, source: string): Error {
  const issue = error.issues[0]!;
  const path = issue.path.map((part) => String(part));
  const [root, entry, property] = path;

  if (!root) {
    return new Error(`${source} must be an object.`);
  }

  if (root === 'components') {
    if (!entry) {
      return new Error(`${source}.components must be an object.`);
    }

    if (entry === 'source') {
      return new Error(`${source}.components.source must be a non-empty string.`);
    }

    if (entry === 'overrides') {
      if (!property) {
        return new Error(`${source}.components.overrides must be an object when provided.`);
      }
      return new Error(`${source}.components.overrides.${property} must be an object.`);
    }

    return new Error(`${source}.components.${entry} is invalid.`);
  }

  if (root === 'fields') {
    if (!entry) {
      return new Error(`${source}.fields must be an object when provided.`);
    }

    if (!property) {
      return new Error(`${source}.fields.${entry} must be an object.`);
    }

    if (property === 'component') {
      return new Error(`${source}.fields.${entry}.component must be a non-empty string.`);
    }

    if (property === 'props') {
      return new Error(`${source}.fields.${entry}.props must be an object when provided.`);
    }

    return new Error(`${source}.fields.${entry} must be an object.`);
  }

  if (root === 'defaults') {
    if (!entry) {
      return new Error(`${source}.defaults must be an object when provided.`);
    }

    return new Error(`${source}.defaults.${entry} is invalid.`);
  }

  if (root === 'schemas') {
    if (!entry) {
      return new Error(`${source}.schemas must be an object when provided.`);
    }

    if (!property) {
      return new Error(`${source}.schemas.${entry} must be an object.`);
    }

    if (property === 'fields') {
      const fieldName = path[3];
      const fieldProp = path[4];
      if (fieldName && fieldProp) {
        return new Error(`${source}.schemas.${entry}.fields.${fieldName}.${fieldProp} is invalid.`);
      }
      if (fieldName) {
        return new Error(`${source}.schemas.${entry}.fields.${fieldName} must be an object.`);
      }
      return new Error(`${source}.schemas.${entry}.fields must be an object when provided.`);
    }

    return new Error(`${source}.schemas.${entry}.${property} is invalid.`);
  }

  if (root === 'overwrite') {
    return new Error(`${source}.overwrite must be a boolean when provided.`);
  }

  if (root === 'types') {
    return new Error(`${source}.types must be an array of strings when provided.`);
  }

  if (root === 'include') {
    return new Error(`${source}.include must be an array of strings when provided.`);
  }

  if (root === 'exclude') {
    return new Error(`${source}.exclude must be an array of strings when provided.`);
  }

  return new Error(`${source} is invalid: ${issue.message}`);
}

// ─── Preset Override Maps ─────────────────────────────────────────────

/** shadcn preset — Radix-based components need controlled mode + field expression props */
export const SHADCN_OVERRIDES: Record<string, ComponentOverride> = {
  Select: {
    controlled: true,
    props: { onValueChange: 'field.onChange' }
  },
  Checkbox: {
    controlled: true,
    props: { checked: 'field.value', onCheckedChange: 'field.onChange' }
  },
  Switch: {
    controlled: true,
    props: { checked: 'field.value', onCheckedChange: 'field.onChange' }
  }
};

/** Default HTML preset — no controlled components by default */
export const DEFAULT_OVERRIDES: Record<string, ComponentOverride> = {};

// ─── Public Functions ─────────────────────────────────────────────────

const PRESET_MAP: Record<ComponentPreset, Record<string, ComponentOverride>> = {
  shadcn: SHADCN_OVERRIDES,
  html: DEFAULT_OVERRIDES
};

export function defineConfig<
  TComponents extends Record<string, unknown> = Record<string, unknown>,
  TSchemas extends Record<string, unknown> = Record<string, unknown>
>(config: ZodFormsConfig<TComponents, TSchemas>): ZodFormsConfig<TComponents, TSchemas> {
  const preset = config.components.preset;
  if (!preset) {
    return config;
  }

  const base = PRESET_MAP[preset];
  return {
    ...config,
    components: {
      ...config.components,
      overrides: { ...base, ...config.components.overrides } as typeof config.components.overrides
    }
  };
}

export function validateConfig(
  value: unknown,
  source = 'config'
): ZodFormsConfig<Record<string, unknown>> {
  const parsed = configSchema.safeParse(value);
  if (!parsed.success) {
    throw formatValidationError(parsed.error, source);
  }

  return parsed.data as ZodFormsConfig<Record<string, unknown>>;
}

export function resolveFieldConfig(
  globalFields: Record<string, FieldConfig> | undefined,
  schemaFields: Partial<Record<string, FieldConfig>> | undefined
): Record<string, FieldConfig> {
  if (!globalFields && !schemaFields) {
    return {};
  }

  if (!globalFields) {
    return { ...schemaFields } as Record<string, FieldConfig>;
  }

  if (!schemaFields) {
    return { ...globalFields };
  }

  const merged: Record<string, FieldConfig> = { ...globalFields };
  for (const [key, schemaField] of Object.entries(schemaFields)) {
    if (!schemaField) {
      continue;
    }
    const globalField = merged[key];
    if (globalField) {
      merged[key] = { ...globalField, ...schemaField };
    } else {
      merged[key] = schemaField;
    }
  }

  return merged;
}

export function normalizeConfig(
  config: ZodFormsConfig<Record<string, unknown>>
): ZodFormsConfig<Record<string, unknown>> {
  const hasTopLevelOverwrite = 'overwrite' in config && config.overwrite !== undefined;

  if (!hasTopLevelOverwrite) {
    return config;
  }

  const { overwrite, ...rest } = config as ZodFormsConfig<Record<string, unknown>> & {
    overwrite?: boolean;
  };
  return {
    ...rest,
    defaults: {
      ...rest.defaults,
      overwrite: rest.defaults?.overwrite ?? overwrite
    }
  };
}

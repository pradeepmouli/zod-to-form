import { z } from 'zod';
import type { FieldConfig } from './types.js';

// ─── Shared Types ─────────────────────────────────────────────────────

export type ComponentEntry<T extends Record<string, unknown> = Record<string, unknown>> = {
  component: keyof T & string;
  render?: () => Promise<unknown>;
};

export type FormPrimitivesConfig<T extends Record<string, unknown> = Record<string, unknown>> = {
  field?: keyof T & string;
  label?: keyof T & string;
  control?: keyof T & string;
};

// ─── Typed Field Config ──────────────────────────────────────────────

/** Field config with props constrained to a specific component's prop type */
type TypedFieldConfigForComponent<TComponents extends Record<string, unknown>, K extends keyof TComponents & string> = {
  fieldType: K;
  order?: number;
  hidden?: boolean;
  gridColumn?: string;
  props?: TComponents[K] extends Record<string, unknown> ? Partial<TComponents[K]> : Record<string, unknown>;
};

/** Field config with no fieldType specified (untyped props) */
type UntypedFieldConfig = {
  fieldType?: undefined;
  order?: number;
  hidden?: boolean;
  gridColumn?: string;
  props?: Record<string, unknown>;
};

/**
 * Discriminated union over component keys.
 * When `fieldType` is set to a known component key, `props` is constrained
 * to that component's prop type. When `fieldType` is omitted, `props` is
 * an open `Record<string, unknown>`.
 */
export type TypedFieldConfig<TComponents extends Record<string, unknown> = Record<string, unknown>> =
  | { [K in keyof TComponents & string]: TypedFieldConfigForComponent<TComponents, K> }[keyof TComponents & string]
  | UntypedFieldConfig;

// ─── New Config Types ─────────────────────────────────────────────────

export type ConfigDefaults = {
  mode?: 'submit' | 'auto-save';
  ui?: 'shadcn' | 'unstyled';
  out?: string;
  overwrite?: boolean;
  serverAction?: boolean;
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

export type FieldTypePreset = 'shadcn' | 'unstyled';

export type ZodFormsConfig<
  TComponents extends Record<string, unknown> = Record<string, unknown>,
  TSchemas extends Record<string, unknown> = Record<string, unknown>
> = {
  components: string;
  preset?: FieldTypePreset;
  fieldTypes: Record<string, ComponentEntry<TComponents>>;
  formPrimitives?: FormPrimitivesConfig<TComponents>;
  defaults?: ConfigDefaults;
  types?: string[];
  include?: string[];
  exclude?: string[];
  fields?: Record<string, TypedFieldConfig<TComponents>>;
  schemas?: {
    [K in keyof TSchemas & string]?: ZodTypeConfig<
      TSchemas[K] extends z.ZodType ? SchemaFieldPath<TSchemas[K]> : string,
      TComponents
    >;
  };
};

// ─── Deprecated Aliases ───────────────────────────────────────────────

/** @deprecated Use FieldConfig instead */
export type FieldOverride = FieldConfig;

/** @deprecated Use ZodFormsConfig instead */
export type ZodToFormComponentConfig<
  T extends Record<string, unknown> = Record<string, unknown>,
  _TFieldPath extends string = string
> = ZodFormsConfig<T>;

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

type FieldPath<TValues extends Record<string, unknown>> = DotPath<TValues> extends infer TPath
  ? TPath extends string
    ? TPath | NormalizeArrayPath<TPath>
    : never
  : never;

/** Extracts dot-notation field paths from a Zod schema's inferred type */
type SchemaFieldPath<T extends z.ZodType> = z.infer<T> extends infer O
  ? O extends Record<string, unknown>
    ? FieldPath<O>
    : string
  : string;

// ─── Validation Schemas ───────────────────────────────────────────────

const nonEmptyStringSchema = z.string().trim().min(1);

const componentEntrySchema = z
  .object({
    component: nonEmptyStringSchema,
    render: z
      .unknown()
      .optional()
      .refine((value) => value === undefined || typeof value === 'function')
  })
  .passthrough();

const fieldConfigSchema = z
  .object({
    fieldType: nonEmptyStringSchema.optional(),
    order: z.number().optional(),
    hidden: z.boolean().optional(),
    gridColumn: z.string().optional(),
    props: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough();

const fieldOverrideSchema = z
  .object({
    fieldType: nonEmptyStringSchema,
    props: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough();

const defaultsSchema = z
  .object({
    mode: z.string().optional(),
    ui: z.string().optional(),
    out: z.string().optional(),
    overwrite: z.boolean().optional(),
    serverAction: z.boolean().optional()
  })
  .passthrough()
  .optional();

const zodTypeConfigSchema = z
  .object({
    name: z.string().optional(),
    mode: z.string().optional(),
    out: z.string().optional(),
    serverAction: z.boolean().optional(),
    fields: z.record(z.string(), fieldConfigSchema).optional()
  })
  .passthrough();

const configSchema = z
  .object({
    components: nonEmptyStringSchema,
    preset: z.enum(['shadcn', 'unstyled']).optional(),
    overwrite: z.boolean().optional(),
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    types: z.array(z.string()).optional(),
    fieldTypes: z.record(z.string(), componentEntrySchema),
    formPrimitives: z.record(z.string(), nonEmptyStringSchema).optional(),
    fields: z.record(z.string(), fieldOverrideSchema.or(fieldConfigSchema)).optional(),
    defaults: defaultsSchema,
    schemas: z.record(z.string(), zodTypeConfigSchema).optional()
  })
  .passthrough();

// ─── Error Formatting ─────────────────────────────────────────────────

function formatValidationError(error: z.ZodError, source: string): Error {
  const [issue] = error.issues;
  if (!issue) {
    return new Error(`${source} is invalid.`);
  }

  const path = issue.path.map((part) => String(part));
  const [root, entry, property] = path;

  if (!root) {
    return new Error(`${source} must be an object.`);
  }

  if (root === 'components') {
    return new Error(`${source}.components must be a non-empty string.`);
  }

  if (root === 'fieldTypes') {
    if (!entry) {
      return new Error(`${source}.fieldTypes must be an object.`);
    }

    if (!property) {
      return new Error(`${source}.fieldTypes.${entry} must be an object.`);
    }

    if (property === 'component') {
      return new Error(`${source}.fieldTypes.${entry}.component must be a non-empty string.`);
    }

    if (property === 'render') {
      return new Error(`${source}.fieldTypes.${entry}.render must be a function when provided.`);
    }

    return new Error(`${source}.fieldTypes.${entry} must be an object.`);
  }

  if (root === 'formPrimitives') {
    if (!entry) {
      return new Error(`${source}.formPrimitives must be an object when provided.`);
    }

    return new Error(
      `${source}.formPrimitives.${entry} must be a non-empty string when provided.`
    );
  }

  if (root === 'fields') {
    if (!entry) {
      return new Error(`${source}.fields must be an object when provided.`);
    }

    if (!property) {
      return new Error(`${source}.fields.${entry} must be an object.`);
    }

    if (property === 'fieldType') {
      return new Error(`${source}.fields.${entry}.fieldType must be a non-empty string.`);
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

// ─── Preset Component Maps ───────────────────────────────────────────

export const SHADCN_FIELD_TYPES: Record<string, ComponentEntry> = {
  Input: { component: 'Input' },
  Textarea: { component: 'Textarea' },
  Select: { component: 'Select' },
  Checkbox: { component: 'Checkbox' },
  Switch: { component: 'Switch' },
  DatePicker: { component: 'DatePicker' },
  FileInput: { component: 'FileInput' }
};

export const DEFAULT_FIELD_TYPES: Record<string, ComponentEntry> = {
  Input: { component: 'Input' },
  Textarea: { component: 'Textarea' },
  Select: { component: 'Select' },
  Checkbox: { component: 'Checkbox' }
};

// ─── Public Functions ─────────────────────────────────────────────────

const PRESET_MAP: Record<FieldTypePreset, Record<string, ComponentEntry>> = {
  shadcn: SHADCN_FIELD_TYPES,
  unstyled: DEFAULT_FIELD_TYPES
};

export function defineConfig<
  TComponents extends Record<string, unknown> = Record<string, unknown>,
  TSchemas extends Record<string, unknown> = Record<string, unknown>
>(config: ZodFormsConfig<TComponents, TSchemas>): ZodFormsConfig<TComponents, TSchemas> {
  if (!config.preset) {
    return config;
  }

  const base = PRESET_MAP[config.preset];
  return {
    ...config,
    fieldTypes: { ...base, ...config.fieldTypes } as typeof config.fieldTypes
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
  const hasTopLevelOverwrite =
    'overwrite' in config && config.overwrite !== undefined;

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

// ─── Deprecated Functions ─────────────────────────────────────────────

/** @deprecated Use defineConfig instead */
export function defineComponentConfig<
  TComponents extends Record<string, unknown>,
  TValues extends Record<string, unknown>
>(
  config: Omit<ZodFormsConfig<TComponents>, 'fields'> & {
    overwrite?: boolean;
    fields?: Partial<Record<FieldPath<TValues>, FieldConfig>>;
  }
): Omit<ZodFormsConfig<TComponents>, 'fields'> & {
  overwrite?: boolean;
  fields?: Partial<Record<FieldPath<TValues>, FieldConfig>>;
} {
  return config;
}

/** @deprecated Use validateConfig instead */
export function validateComponentConfig(
  value: unknown,
  source = 'component-config'
): ZodFormsConfig<Record<string, unknown>> {
  return validateConfig(value, source);
}

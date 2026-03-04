import { z } from 'zod';

export type ComponentEntry<T extends Record<string, unknown> = Record<string, unknown>> = {
  component: keyof T & string;
  render?: () => Promise<unknown>;
};

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

const fieldOverrideSchema = z
  .object({
    fieldType: nonEmptyStringSchema,
    props: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough();

const componentConfigSchema = z
  .object({
    components: nonEmptyStringSchema,
    overwrite: z.boolean().optional(),
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    types: z.array(z.string()).optional(),
    fieldTypes: z.record(z.string(), componentEntrySchema),
    formPrimitives: z.record(z.string(), nonEmptyStringSchema).optional(),
    fields: z.record(z.string(), fieldOverrideSchema).optional()
  })
  .passthrough();

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

export function validateComponentConfig(
  value: unknown,
  source = 'component-config'
): ZodToFormComponentConfig<Record<string, unknown>> {
  const parsed = componentConfigSchema.safeParse(value);
  if (!parsed.success) {
    throw formatValidationError(parsed.error, source);
  }

  return parsed.data as ZodToFormComponentConfig<Record<string, unknown>>;
}

export function defineComponentConfig<
  TComponents extends Record<string, unknown>,
  TValues extends Record<string, unknown>
>(
  config: ZodToFormComponentConfig<TComponents, FieldPath<TValues>>
): ZodToFormComponentConfig<TComponents, FieldPath<TValues>> {
  return config;
}

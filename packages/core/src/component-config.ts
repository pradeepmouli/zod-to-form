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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function validateComponentConfig(
  value: unknown,
  source = 'component-config'
): ZodToFormComponentConfig<Record<string, unknown>> {
  if (!isObjectRecord(value)) {
    throw new Error(`${source} must be an object.`);
  }

  const components = value['components'];
  if (typeof components !== 'string' || components.trim().length === 0) {
    throw new Error(`${source}.components must be a non-empty string.`);
  }

  const fieldTypes = value['fieldTypes'];
  if (!isObjectRecord(fieldTypes)) {
    throw new Error(`${source}.fieldTypes must be an object.`);
  }

  for (const [fieldType, entryValue] of Object.entries(fieldTypes)) {
    if (!isObjectRecord(entryValue)) {
      throw new Error(`${source}.fieldTypes.${fieldType} must be an object.`);
    }

    const component = entryValue['component'];
    if (typeof component !== 'string' || component.trim().length === 0) {
      throw new Error(`${source}.fieldTypes.${fieldType}.component must be a non-empty string.`);
    }

    const render = entryValue['render'];
    if (render !== undefined && typeof render !== 'function') {
      throw new Error(`${source}.fieldTypes.${fieldType}.render must be a function when provided.`);
    }
  }

  const formPrimitives = value['formPrimitives'];
  if (formPrimitives !== undefined) {
    if (!isObjectRecord(formPrimitives)) {
      throw new Error(`${source}.formPrimitives must be an object when provided.`);
    }

    for (const [primitiveName, primitiveValue] of Object.entries(formPrimitives)) {
      if (typeof primitiveValue !== 'string' || primitiveValue.trim().length === 0) {
        throw new Error(
          `${source}.formPrimitives.${primitiveName} must be a non-empty string when provided.`
        );
      }
    }
  }

  const fields = value['fields'];
  if (fields !== undefined) {
    if (!isObjectRecord(fields)) {
      throw new Error(`${source}.fields must be an object when provided.`);
    }

    for (const [fieldPath, overrideValue] of Object.entries(fields)) {
      if (!isObjectRecord(overrideValue)) {
        throw new Error(`${source}.fields.${fieldPath} must be an object.`);
      }

      const fieldType = overrideValue['fieldType'];
      if (typeof fieldType !== 'string' || fieldType.trim().length === 0) {
        throw new Error(`${source}.fields.${fieldPath}.fieldType must be a non-empty string.`);
      }

      const props = overrideValue['props'];
      if (props !== undefined && !isObjectRecord(props)) {
        throw new Error(`${source}.fields.${fieldPath}.props must be an object when provided.`);
      }
    }
  }

  const overwrite = value['overwrite'];
  if (overwrite !== undefined && typeof overwrite !== 'boolean') {
    throw new Error(`${source}.overwrite must be a boolean when provided.`);
  }

  const types = value['types'];
  if (types !== undefined) {
    if (!Array.isArray(types) || types.some((entry) => typeof entry !== 'string')) {
      throw new Error(`${source}.types must be an array of strings when provided.`);
    }
  }

  const include = value['include'];
  if (include !== undefined) {
    if (!Array.isArray(include) || include.some((entry) => typeof entry !== 'string')) {
      throw new Error(`${source}.include must be an array of strings when provided.`);
    }
  }

  const exclude = value['exclude'];
  if (exclude !== undefined) {
    if (!Array.isArray(exclude) || exclude.some((entry) => typeof entry !== 'string')) {
      throw new Error(`${source}.exclude must be an array of strings when provided.`);
    }
  }

  return value as ZodToFormComponentConfig<Record<string, unknown>>;
}

export function defineComponentConfig<
  TComponents extends Record<string, unknown>,
  TValues extends Record<string, unknown>
>(
  config: ZodToFormComponentConfig<TComponents, FieldPath<TValues>>
): ZodToFormComponentConfig<TComponents, FieldPath<TValues>> {
  return config;
}

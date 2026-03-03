export type ComponentEntry<T extends Record<string, unknown> = Record<string, unknown>> = {
  component: keyof T & string;
  render?: () => Promise<unknown>;
};

export type FieldOverride = {
  fieldType: string;
  props?: Record<string, unknown>;
};

export type ZodToFormComponentConfig<
  T extends Record<string, unknown> = Record<string, unknown>,
  TFieldPath extends string = string
> = {
  components: string;
  fieldTypes: Record<string, ComponentEntry<T>>;
  fields?: Partial<Record<TFieldPath, FieldOverride>>;
};

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

  return value as ZodToFormComponentConfig<Record<string, unknown>>;
}

export function defineComponentConfig<
  TComponents extends Record<string, unknown>,
  TFieldPath extends string = string
>(
  config: ZodToFormComponentConfig<TComponents, TFieldPath>
): ZodToFormComponentConfig<TComponents, TFieldPath> {
  return config;
}

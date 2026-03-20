import { useMemo, memo } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { FormField, FieldConfig, ComponentOverride } from '@zod-to-form/core';
import { getEmptyDefault } from '@zod-to-form/core';
import { useController, useFieldArray, useFormContext } from 'react-hook-form';
import { defaultComponentMap } from './components/index.js';

type ComponentMap = typeof defaultComponentMap;

export type RuntimeComponentConfig = {
  /**
   * Component source and optional per-component overrides.
   * `source` is used by CLI codegen to emit a static import statement (not used at runtime).
   * `overrides` maps component names to `ComponentOverride` metadata (controlled, propMap, etc.).
   */
  components: {
    source: string;
    overrides?: Record<string, ComponentOverride>;
  };
  /**
   * The pre-imported components module object, e.g. `import * as myComponents from './components'`.
   * Used to resolve component functions by name at runtime.
   */
  componentModule?: Record<string, unknown>;
  fields?: Record<string, FieldConfig>;
  /**
   * Pre-imported section components, keyed by the section name used in `fields[key].section`.
   * Required when using section field grouping at runtime.
   */
  sectionComponents?: Record<string, ComponentType<{ fields: string[] }>>;
};

function resolveFieldOverride(
  field: FormField,
  componentConfig: RuntimeComponentConfig | undefined
): { override?: FieldConfig; componentOverride?: ComponentOverride } {
  if (!componentConfig) {
    return {};
  }

  const override = componentConfig.fields?.[field.key];
  if (override) {
    return {
      componentOverride:
        componentConfig.components.overrides?.[override.component ?? field.component],
      override
    };
  }

  return {
    componentOverride: componentConfig.components.overrides?.[field.component]
  };
}

function asComponentType(
  value: unknown,
  errorMessage: string
): ComponentType<Record<string, unknown>> {
  if (typeof value !== 'function') {
    throw new Error(errorMessage);
  }

  return value as ComponentType<Record<string, unknown>>;
}

function resolveConfiguredComponent(
  field: FormField,
  componentConfig: RuntimeComponentConfig
): ComponentType<Record<string, unknown>> {
  const mod = componentConfig.componentModule;
  if (!mod) {
    throw new Error(
      `INVALID_RUNTIME_COMPONENT: componentModule is not provided for field "${field.key}". ` +
        `Pass the pre-imported module as componentConfig.componentModule.`
    );
  }
  const candidate = mod[field.component];
  return asComponentType(
    candidate,
    `INVALID_RUNTIME_COMPONENT: component "${field.component}" in componentModule is not a function.`
  );
}

function getErrorAtPath(errors: unknown, path: string): string | undefined {
  const segments = path.split('.');
  let current = errors as Record<string, unknown> | undefined;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = current[segment] as Record<string, unknown> | undefined;
  }

  const message = current?.['message'];
  if (typeof message === 'string') {
    return message;
  }

  return undefined;
}

function getRegisterOptions(field: FormField): Record<string, unknown> {
  if (field.zodType === 'number' || field.zodType === 'bigint') {
    return { valueAsNumber: true };
  }

  if (field.zodType === 'date') {
    return { valueAsDate: true };
  }

  if (field.zodType === 'file') {
    return {
      setValueAs: (value: unknown) => {
        if (value instanceof FileList) {
          return value.length > 0 ? value.item(0) : undefined;
        }
        return value;
      }
    };
  }

  return {};
}

type FieldRendererProps = {
  field: FormField;
  components?: Partial<ComponentMap>;
  componentConfig?: RuntimeComponentConfig;
};

// ─── T088: Fieldset block for nested object fields ────────────────────

const FieldsetBlock = memo(function FieldsetBlock({
  field,
  components,
  componentConfig
}: FieldRendererProps) {
  const componentMap = { ...defaultComponentMap, ...components };
  const FieldComponent = componentMap.Field;

  const wrapperProps: Record<string, unknown> = {};
  if (field.gridColumn) {
    wrapperProps['style'] = { gridColumn: field.gridColumn };
  }

  return (
    <FieldComponent {...wrapperProps}>
      <fieldset>
        <legend>{field.label}</legend>
        {field.children?.map((child) => (
          <FieldRenderer
            key={child.key}
            field={child}
            components={componentMap}
            componentConfig={componentConfig}
          />
        ))}
      </fieldset>
    </FieldComponent>
  );
});

// ─── T089: Array block with useFieldArray ─────────────────────────────

function getDefaultAppendValue(arrayItem: FormField | undefined): unknown {
  if (!arrayItem) return '';
  return getEmptyDefault(arrayItem);
}

const ArrayBlock = memo(function ArrayBlock({
  field,
  components,
  componentConfig
}: FieldRendererProps) {
  const componentMap = { ...defaultComponentMap, ...components };
  const { control } = useFormContext();
  const { fields: items, append, remove } = useFieldArray({ control, name: field.key });
  const minLength = field.constraints.minLength ?? 0;

  const wrapperProps: Record<string, unknown> = {};
  if (field.gridColumn) {
    wrapperProps['style'] = { gridColumn: field.gridColumn };
  }

  return (
    <fieldset {...wrapperProps}>
      <legend>{field.label}</legend>
      {items.map((item, index) => {
        if (!field.arrayItem) return null;
        const itemField: FormField = { ...field.arrayItem, key: `${field.key}.${index}` };
        return (
          <div key={item.id}>
            <FieldRenderer
              field={itemField}
              components={componentMap}
              componentConfig={componentConfig}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={items.length <= minLength}
            >
              Remove
            </button>
          </div>
        );
      })}
      <button type="button" onClick={() => append(getDefaultAppendValue(field.arrayItem))}>
        Add
      </button>
    </fieldset>
  );
});

// ─── T090: Discriminated union block with watch ───────────────────────

const DiscriminatedUnionBlock = memo(function DiscriminatedUnionBlock({
  field,
  components,
  componentConfig
}: FieldRendererProps) {
  const componentMap = { ...defaultComponentMap, ...components };
  const { register, watch } = useFormContext();
  const discriminator = field.props['_discriminator'] as string;
  const discKey = `${field.key}.${discriminator}`;
  const currentValue = watch(discKey) as string | undefined;
  const variants = field.props['_variants'] as Record<string, FormField[]> | undefined;
  const variantFields = currentValue ? (variants?.[currentValue] ?? []) : [];

  const FieldComponent = componentMap.Field;
  const FieldLabelComponent = componentMap.FieldLabel;
  const wrapperProps: Record<string, unknown> = {};
  if (field.gridColumn) {
    wrapperProps['style'] = { gridColumn: field.gridColumn };
  }

  return (
    <FieldComponent {...wrapperProps}>
      <FieldLabelComponent htmlFor={discKey}>{field.label}</FieldLabelComponent>
      <select id={discKey} {...register(discKey)}>
        <option value="">Select…</option>
        {field.options?.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
      {variantFields.map((child) => (
        <FieldRenderer
          key={child.key}
          field={child}
          components={componentMap}
          componentConfig={componentConfig}
        />
      ))}
    </FieldComponent>
  );
});

/**
 * Apply propMap to remap RHF controller field props to component-specific prop names.
 * Default RHF field props: value, onChange, onBlur, ref, name.
 * propMap entries like { onSelect: 'field.onChange' } replace the default mapping.
 */
function applyPropMap(
  controllerField: Record<string, unknown>,
  propMap: Record<string, string> | undefined
): Record<string, unknown> {
  if (!propMap) return controllerField;

  const result: Record<string, unknown> = {};
  const rhfFieldProps: Record<string, string> = {
    'field.value': 'value',
    'field.onChange': 'onChange',
    'field.onBlur': 'onBlur',
    'field.ref': 'ref',
    'field.name': 'name'
  };

  // Track which RHF expressions are remapped
  const remappedExprs = new Set(Object.values(propMap));

  // Copy defaults that aren't being remapped away
  for (const [expr, defaultProp] of Object.entries(rhfFieldProps)) {
    if (!remappedExprs.has(expr)) {
      result[defaultProp] = controllerField[defaultProp];
    }
  }

  // Apply remapped props
  for (const [componentProp, rhfExpr] of Object.entries(propMap)) {
    const defaultProp = rhfFieldProps[rhfExpr];
    if (defaultProp) {
      result[componentProp] = controllerField[defaultProp];
    }
  }

  return result;
}

/**
 * Merge component-level propMap with per-field propMap override.
 * Per-field entries win when keys overlap.
 */
function resolvePropMap(
  componentOverride?: ComponentOverride,
  fieldOverride?: FieldConfig
): Record<string, string> | undefined {
  const entryMap = componentOverride?.propMap;
  const fieldMap = fieldOverride?.propMap;
  if (!entryMap && !fieldMap) return undefined;
  return { ...entryMap, ...fieldMap };
}

// ─── Controlled field wrapper ──────────────────────────────────────────
// Separated into its own component so useController is always called
// (React rules of hooks) without affecting non-controlled fields.

type ControlledFieldProps = {
  field: FormField;
  Component: ComponentType<Record<string, unknown>>;
  propMap: Record<string, string> | undefined;
  overrideProps?: Record<string, unknown>;
  errorMessage?: string;
};

const ControlledFieldInner = memo(function ControlledFieldInner({
  field,
  Component,
  propMap,
  overrideProps,
  errorMessage
}: ControlledFieldProps) {
  const { control } = useFormContext();
  // Note: useController does not use register() options like valueAsNumber/valueAsDate.
  // Controlled components manage their own value types via onChange — the component
  // is responsible for passing the correct value type back to RHF.
  const { field: controllerField } = useController({ name: field.key, control });

  const mappedProps = applyPropMap(controllerField as unknown as Record<string, unknown>, propMap);

  const componentProps: Record<string, unknown> = {
    id: field.key,
    'aria-invalid': errorMessage ? 'true' : 'false',
    required: field.required,
    readOnly: field.readOnly,
    ...field.props,
    ...overrideProps,
    ...mappedProps
  };

  if ('options' in field && field['options']) {
    componentProps['options'] = field['options'];
  }

  return <Component {...componentProps} />;
});

export const FieldRenderer = memo(function FieldRenderer({
  field,
  components,
  componentConfig
}: FieldRendererProps) {
  // Always call hooks first (React hooks rule — no conditional hook calls)
  const { register, formState } = useFormContext();
  const componentMap = { ...defaultComponentMap, ...components };
  const mapping = useMemo(
    () => resolveFieldOverride(field, componentConfig),
    [field, componentConfig]
  );

  // Synchronous component resolution from componentModule
  const configuredComponent = useMemo(() => {
    if (!componentConfig?.componentModule) return null;
    return resolveConfiguredComponent(field, componentConfig);
  }, [field, componentConfig]);

  // T088: dispatch nested object fields to FieldsetBlock
  if (field.component === 'Fieldset') {
    return (
      <FieldsetBlock field={field} components={componentMap} componentConfig={componentConfig} />
    );
  }

  // T089: dispatch array fields to ArrayBlock
  if (field.component === 'ArrayField') {
    return <ArrayBlock field={field} components={componentMap} componentConfig={componentConfig} />;
  }

  // T090: dispatch discriminated union to DiscriminatedUnionBlock
  if (field.component === 'Select' && field.props['_discriminator']) {
    return (
      <DiscriminatedUnionBlock
        field={field}
        components={componentMap}
        componentConfig={componentConfig}
      />
    );
  }

  const Component = (configuredComponent ??
    componentMap[field.component as keyof ComponentMap] ??
    componentMap.Input) as ComponentType<Record<string, unknown>>;
  const FieldComponent = componentMap.Field;
  const FieldLabelComponent = componentMap.FieldLabel;
  const FieldDescriptionComponent = componentMap.FieldDescription;
  const FieldMessageComponent = componentMap.FieldMessage;
  const errorMessage = getErrorAtPath(formState.errors, field.key);

  if (field.hidden) {
    return null;
  }

  // Fields with a section config are rendered by the section component, not individually
  if (mapping.override?.section) {
    return null;
  }

  const isControlled = mapping.componentOverride?.controlled === true;

  const wrapperProps: Record<string, unknown> = {};
  if (field.gridColumn) {
    wrapperProps['style'] = { gridColumn: field.gridColumn };
  }

  let fieldContent: ReactNode;

  if (field.render) {
    const registration = register(field.key, getRegisterOptions(field));
    const componentProps: Record<string, unknown> = {
      id: field.key,
      'aria-invalid': errorMessage ? 'true' : 'false',
      required: field.required,
      readOnly: field.readOnly,
      ...field.props,
      ...mapping.override?.props,
      ...registration
    };
    fieldContent = field.render(field, componentProps) as ReactNode;
  } else if (isControlled) {
    const propMap = resolvePropMap(mapping.componentOverride, mapping.override);
    fieldContent = (
      <ControlledFieldInner
        field={field}
        Component={Component}
        propMap={propMap}
        overrideProps={mapping.override?.props}
        errorMessage={errorMessage}
      />
    );
  } else {
    const registration = register(field.key, getRegisterOptions(field));
    const componentProps: Record<string, unknown> = {
      id: field.key,
      'aria-invalid': errorMessage ? 'true' : 'false',
      required: field.required,
      readOnly: field.readOnly,
      ...field.props,
      ...mapping.override?.props,
      ...registration
    };
    if ('options' in field && field['options']) {
      componentProps['options'] = field['options'];
    }
    fieldContent = <Component {...componentProps} />;
  }

  return (
    <FieldComponent {...wrapperProps}>
      <FieldLabelComponent htmlFor={field.key}>{field.label}</FieldLabelComponent>
      {fieldContent}
      {field.description ? (
        <FieldDescriptionComponent>{field.description}</FieldDescriptionComponent>
      ) : null}
      {errorMessage ? <FieldMessageComponent>{errorMessage}</FieldMessageComponent> : null}
    </FieldComponent>
  );
});

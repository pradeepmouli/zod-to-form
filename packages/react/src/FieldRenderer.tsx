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
   * `overrides` maps component names to `ComponentOverride` metadata (controlled, props, etc.).
   */
  components: {
    source: string;
    overrides?: Record<string, ComponentOverride>;
  };
  /**
   * The pre-imported components module object, e.g. `import * as myComponents from './components'`.
   * Used to resolve component functions by name at runtime.
   * Section components are also resolved from this module.
   */
  componentModule?: Record<string, unknown>;
  fields?: Record<string, FieldConfig>;
};

const _warnedPropMap = new Set<string>();

/**
 * One-time validation of component config for removed keys.
 * Called once per form render (from ZodForm), not per field.
 */
export function warnRemovedConfigKeys(componentConfig: RuntimeComponentConfig | undefined): void {
  if (!componentConfig) return;

  // Warn about removed propMap key on component overrides
  if (componentConfig.components.overrides) {
    for (const [name, entry] of Object.entries(componentConfig.components.overrides)) {
      if (entry && 'propMap' in entry && !_warnedPropMap.has(`__override__${name}`)) {
        _warnedPropMap.add(`__override__${name}`);
        console.warn(
          `[zod-to-form] Component override "${name}" uses "propMap" which has been removed. ` +
            `Move field expression values into "props" instead.`
        );
      }
    }
  }

  // Warn about removed keys on field configs
  if (componentConfig.fields) {
    for (const [key, fieldConfig] of Object.entries(componentConfig.fields)) {
      if (fieldConfig && 'propMap' in fieldConfig && !_warnedPropMap.has(key)) {
        _warnedPropMap.add(key);
        console.warn(
          `[zod-to-form] Field "${key}" uses "propMap" which has been removed. ` +
            `Move field expression values into "props" instead. ` +
            `Example: props: { onValueChange: 'field.onChange' }`
        );
      }
      if (
        fieldConfig &&
        'gridColumn' in fieldConfig &&
        !_warnedPropMap.has(`__gridColumn__${key}`)
      ) {
        _warnedPropMap.add(`__gridColumn__${key}`);
        console.warn(
          `[zod-to-form] Field "${key}" uses "gridColumn" which has been removed. ` +
            `Use "props.style" or "props.className" for layout instead.`
        );
      }
    }
  }

  // Warn about field expressions in props without controlled: true
  if (componentConfig.components.overrides) {
    for (const [name, entry] of Object.entries(componentConfig.components.overrides)) {
      if (!entry?.props || entry.controlled) continue;
      const hasFieldExpr = Object.values(entry.props).some(
        (v) => typeof v === 'string' && FIELD_EXPRESSIONS.has(v)
      );
      if (hasFieldExpr && !_warnedPropMap.has(`__no_controlled__${name}`)) {
        _warnedPropMap.add(`__no_controlled__${name}`);
        console.warn(
          `[zod-to-form] Component override "${name}" has field expression values in "props" ` +
            `but "controlled" is not set to true. Field expressions are only resolved for controlled components.`
        );
      }
    }
  }
}

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

export interface FieldTemplateProps {
  children: ReactNode;
  label: string;
  description?: string;
  helpText?: string;
  error?: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  deprecated?: boolean;
}

function DefaultFieldTemplate({
  children,
  label,
  description,
  helpText,
  error,
  name,
  deprecated
}: FieldTemplateProps) {
  const { FieldLabel, FieldDescription, FieldMessage } = defaultComponentMap;
  return (
    <>
      <FieldLabel htmlFor={name}>
        {deprecated ? <s>{label}</s> : label}
        {deprecated ? <span title="Deprecated"> ⚠</span> : null}
      </FieldLabel>
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {helpText ? (
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>{helpText}</p>
      ) : null}
      {error ? <FieldMessage>{error}</FieldMessage> : null}
    </>
  );
}

type FieldRendererProps = {
  field: FormField;
  components?: Partial<ComponentMap>;
  componentConfig?: RuntimeComponentConfig;
};

// ─── T088: Fieldset block for nested object fields ────────────────────

const _warnedFieldsetComponent = new Set<string>();

const FieldsetBlock = memo(function FieldsetBlock({
  field,
  components,
  componentConfig
}: FieldRendererProps) {
  const componentMap = { ...defaultComponentMap, ...components };
  const FieldComponent = componentMap.Field;

  // US4: Check for component override on object fields
  const overrideComponentName = componentConfig?.fields?.[field.key]?.component;
  if (overrideComponentName && componentConfig?.componentModule) {
    const candidate = componentConfig.componentModule[overrideComponentName];
    if (typeof candidate === 'function') {
      const OverrideComponent = candidate as ComponentType<{ children?: ReactNode }>;
      return (
        <FieldComponent>
          <OverrideComponent>
            {field.children?.map((child) => (
              <FieldRenderer
                key={child.key}
                field={child}
                components={componentMap}
                componentConfig={componentConfig}
              />
            ))}
          </OverrideComponent>
        </FieldComponent>
      );
    }
    // Warn if component not found, fall back to fieldset
    if (!_warnedFieldsetComponent.has(field.key)) {
      _warnedFieldsetComponent.add(field.key);
      console.warn(
        `[zod-to-form] Field "${field.key}" specifies component "${overrideComponentName}" ` +
          `but it was not found in componentModule. Falling back to <fieldset>.`
      );
    }
  }

  return (
    <FieldComponent>
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

  return (
    <fieldset>
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

  return (
    <FieldComponent>
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

/** Maps field expression strings to their corresponding RHF controller field property names */
const EXPRESSION_TO_FIELD_PROP: Record<string, string> = {
  'field.value': 'value',
  'field.onChange': 'onChange',
  'field.onBlur': 'onBlur',
  'field.ref': 'ref',
  'field.name': 'name'
};

/** Derived from EXPRESSION_TO_FIELD_PROP — guaranteed to stay in sync */
const FIELD_EXPRESSIONS = new Set(Object.keys(EXPRESSION_TO_FIELD_PROP));

/**
 * Resolve props for a controlled component by merging preset override props,
 * per-field config props, and the RHF controller field.
 *
 * - Props whose values match a known field expression string (e.g., `'field.onChange'`)
 *   are resolved from the RHF controller field.
 * - All other props pass through as literal values.
 * - Merge order: preset override props → field config props (field wins on conflict).
 * - RHF default props (value, onChange, onBlur, ref, name) are included unless
 *   a field expression explicitly remaps that controller property to a different prop name.
 */
function resolveProps(
  controllerField: Record<string, unknown>,
  presetProps: Record<string, unknown> | undefined,
  fieldProps: Record<string, unknown> | undefined
): Record<string, unknown> {
  // Shallow merge: preset first, field config wins on conflict (FR-019)
  const merged: Record<string, unknown> = { ...presetProps, ...fieldProps };

  // Separate field expressions from literal props
  const fieldExpressionEntries: Array<[string, string]> = [];
  const literalEntries: Array<[string, unknown]> = [];

  for (const [key, value] of Object.entries(merged)) {
    if (typeof value === 'string' && FIELD_EXPRESSIONS.has(value)) {
      fieldExpressionEntries.push([key, value]);
    } else {
      literalEntries.push([key, value]);
    }
  }

  // Start with default RHF controller field props
  const result: Record<string, unknown> = { ...controllerField };

  // Track which RHF expressions are remapped to custom prop names
  const remappedExprs = new Set(fieldExpressionEntries.map(([, expr]) => expr));

  // Remove default props whose RHF expression is being remapped to a different name
  for (const [expr, defaultProp] of Object.entries(EXPRESSION_TO_FIELD_PROP)) {
    if (remappedExprs.has(expr)) {
      // Only remove if the remapped prop name differs from the default
      const remappedPropName = fieldExpressionEntries.find(([, e]) => e === expr)?.[0];
      if (remappedPropName !== defaultProp) {
        delete result[defaultProp];
      }
    }
  }

  // Apply field expression mappings — resolve from controller field
  for (const [propName, expr] of fieldExpressionEntries) {
    const controllerProp = EXPRESSION_TO_FIELD_PROP[expr];
    if (controllerProp) {
      result[propName] = controllerField[controllerProp];
    }
  }

  // Apply literal props (override any controller defaults)
  for (const [key, value] of literalEntries) {
    result[key] = value;
  }

  return result;
}

// ─── Controlled field wrapper ──────────────────────────────────────────
// Separated into its own component so useController is always called
// (React rules of hooks) without affecting non-controlled fields.

type ControlledFieldProps = {
  field: FormField;
  Component: ComponentType<Record<string, unknown>>;
  presetProps: Record<string, unknown> | undefined;
  fieldConfigProps: Record<string, unknown> | undefined;
  errorMessage?: string;
};

const ControlledFieldInner = memo(function ControlledFieldInner({
  field,
  Component,
  presetProps,
  fieldConfigProps,
  errorMessage
}: ControlledFieldProps) {
  const { control } = useFormContext();
  const { field: controllerField } = useController({ name: field.key, control });

  const resolved = resolveProps(
    controllerField as unknown as Record<string, unknown>,
    presetProps,
    fieldConfigProps
  );

  const componentProps: Record<string, unknown> = {
    id: field.key,
    'aria-invalid': errorMessage ? 'true' : 'false',
    required: field.required,
    readOnly: field.readOnly,
    disabled: field.disabled,
    ...field.props,
    ...resolved
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
  const errorMessage = getErrorAtPath(formState.errors, field.key);
  const FieldTemplate = DefaultFieldTemplate;

  if (field.hidden) {
    return null;
  }

  // Fields with a section config are rendered by the section component, not individually
  if (mapping.override?.section) {
    return null;
  }

  const isControlled = mapping.componentOverride?.controlled === true;

  let fieldContent: ReactNode;

  if (field.render) {
    const registration = register(field.key, getRegisterOptions(field));
    const componentProps: Record<string, unknown> = {
      id: field.key,
      'aria-invalid': errorMessage ? 'true' : 'false',
      required: field.required,
      readOnly: field.readOnly,
      disabled: field.disabled,
      ...field.props,
      ...mapping.override?.props,
      ...registration
    };
    fieldContent = field.render(field, componentProps) as ReactNode;
  } else if (isControlled) {
    fieldContent = (
      <ControlledFieldInner
        field={field}
        Component={Component}
        presetProps={mapping.componentOverride?.props}
        fieldConfigProps={mapping.override?.props}
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
      disabled: field.disabled,
      ...field.props,
      ...mapping.override?.props,
      ...registration
    };
    if ('options' in field && field['options']) {
      componentProps['options'] = field['options'];
    }
    fieldContent = <Component {...componentProps} />;
  }

  // US5: Forward style and className from field/override props to the wrapper element
  const wrapperProps: Record<string, unknown> = {};
  const mergedFieldProps = { ...field.props, ...mapping.override?.props };
  if (mergedFieldProps['style']) {
    wrapperProps['style'] = mergedFieldProps['style'];
  }
  if (mergedFieldProps['className']) {
    wrapperProps['className'] = mergedFieldProps['className'];
  }

  return (
    <FieldComponent {...wrapperProps}>
      <FieldTemplate
        name={field.key}
        label={field.label}
        description={field.description}
        helpText={field.helpText}
        error={errorMessage}
        required={field.required}
        disabled={field.disabled}
        deprecated={field.deprecated}
      >
        {fieldContent}
      </FieldTemplate>
    </FieldComponent>
  );
});

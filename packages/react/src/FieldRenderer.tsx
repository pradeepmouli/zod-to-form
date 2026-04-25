import { useMemo, memo } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { FormField, FieldConfig, ComponentOverride } from '@zod-to-form/core';
import { getEmptyDefault } from '@zod-to-form/core';
import { useController, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
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

const _warned = new Set<string>();
const _warnedGhostIds = new Set<string>();

/**
 * One-time validation of component config for removed keys.
 * Called once per form render (from ZodForm), not per field.
 */
export function warnRemovedConfigKeys(componentConfig: RuntimeComponentConfig | undefined): void {
  if (!componentConfig) return;

  // Check component overrides for removed keys and misconfiguration
  if (componentConfig.components.overrides) {
    for (const [name, entry] of Object.entries(componentConfig.components.overrides)) {
      if (!entry) continue;

      if ('propMap' in entry && !_warned.has(`override:propMap:${name}`)) {
        _warned.add(`override:propMap:${name}`);
        console.warn(
          `[zod-to-form] Component override "${name}" uses "propMap" which has been removed. ` +
            `Move field expression values into "props" instead.`
        );
      }

      if (entry.props && !entry.controlled) {
        const hasFieldExpr = Object.values(entry.props).some(
          (v) => typeof v === 'string' && FIELD_EXPRESSIONS.has(v)
        );
        if (hasFieldExpr && !_warned.has(`override:noControlled:${name}`)) {
          _warned.add(`override:noControlled:${name}`);
          console.warn(
            `[zod-to-form] Component override "${name}" has field expression values in "props" ` +
              `but "controlled" is not set to true. Field expressions are only resolved for controlled components.`
          );
        }
      }
    }
  }

  // Check field configs for removed keys
  if (componentConfig.fields) {
    for (const [key, fieldConfig] of Object.entries(componentConfig.fields)) {
      if (!fieldConfig) continue;

      if ('propMap' in fieldConfig && !_warned.has(`field:propMap:${key}`)) {
        _warned.add(`field:propMap:${key}`);
        console.warn(
          `[zod-to-form] Field "${key}" uses "propMap" which has been removed. ` +
            `Move field expression values into "props" instead. ` +
            `Example: props: { onValueChange: 'field.onChange' }`
        );
      }
      if ('gridColumn' in fieldConfig && !_warned.has(`field:gridColumn:${key}`)) {
        _warned.add(`field:gridColumn:${key}`);
        console.warn(
          `[zod-to-form] Field "${key}" uses "gridColumn" which has been removed. ` +
            `Use "props.style" or "props.className" for layout instead.`
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

/** Check if a value is a valid React component (function, memo, forwardRef, lazy) */
function isReactComponent(value: unknown): boolean {
  if (typeof value === 'function') return true;
  // React.memo, forwardRef, lazy produce objects with $$typeof
  if (value !== null && typeof value === 'object' && '$$typeof' in value) return true;
  return false;
}

function asComponentType(
  value: unknown,
  errorMessage: string
): ComponentType<Record<string, unknown>> {
  if (!isReactComponent(value)) {
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

function zodSchemaValidate(field: FormField): ((value: unknown) => true | string) | undefined {
  if (field.validation?.mode !== 'zodSchema' || !field.zodSchema) return undefined;
  const schema = field.zodSchema as unknown as {
    safeParse(v: unknown): { success: boolean; error?: { issues: Array<{ message: string }> } };
  };
  return (value: unknown) => {
    // Normalize empty strings to undefined to match zodResolver behavior
    const normalized = value === '' ? undefined : value;
    const result = schema.safeParse(normalized);
    if (result.success) return true;
    return result.error?.issues[0]?.message ?? 'Validation failed';
  };
}

function getRegisterOptions(field: FormField): Record<string, unknown> {
  const opts: Record<string, unknown> = {};

  if (field.zodType === 'number' || field.zodType === 'bigint') {
    opts['valueAsNumber'] = true;
  }

  if (field.zodType === 'date') {
    opts['valueAsDate'] = true;
  }

  if (field.zodType === 'file') {
    opts['setValueAs'] = (value: unknown) => {
      if (value instanceof FileList) {
        return value.length > 0 ? value.item(0) : undefined;
      }
      return value;
    };
  }

  // Optimized validation: per-field validation
  if (field.validation?.mode === 'native' && field.validation.rules) {
    // L2: native RHF rules — spread directly into register options
    const rules = field.validation.rules;
    if (rules.required) opts['required'] = rules.required;
    if (rules.min) opts['min'] = rules.min;
    if (rules.max) opts['max'] = rules.max;
    if (rules.minLength) opts['minLength'] = rules.minLength;
    if (rules.maxLength) opts['maxLength'] = rules.maxLength;
    if (rules.pattern) opts['pattern'] = rules.pattern;
  } else if (field.validation?.mode === 'zodSchema') {
    // L1: per-field zodSchema validation via register({ validate })
    const validate = zodSchemaValidate(field);
    if (validate) {
      opts['validate'] = validate;
    }
  }
  // component-enforced: no validation emitted

  return opts;
}

// TODO(L3): Re-enable when L3 cross-field optimization is implemented
// function useWatchValidate(field: FormField): ((value: unknown) => true | string) | undefined {
//   const { control } = useFormContext();
//   const watchFields = field.validation?.mode === 'watch' ? field.validation.watchFields : undefined;
//   const watchValidate = field.validation?.mode === 'watch' ? field.validation.watchValidate : undefined;
//   const watchedValues = useWatch({ control, name: (watchFields as string[]) ?? [], disabled: !watchFields });
//   if (!watchFields || !watchValidate) return undefined;
//   const watchedMap: Record<string, unknown> = {};
//   for (let i = 0; i < watchFields.length; i++) {
//     watchedMap[watchFields[i]!] = Array.isArray(watchedValues) ? watchedValues[i] : watchedValues;
//   }
//   return (value: unknown) => watchValidate(value, watchedMap);
// }

/**
 * Props passed to the field template component that wraps each rendered form field.
 * The template controls layout: label position, description placement, error display, etc.
 * Override the default template by providing a `FieldTemplate` export in `componentModule`.
 *
 * @category Types
 */
export interface FieldTemplateProps {
  /** The rendered field input (passed as `children`). */
  children: ReactNode;
  /** Human-readable field label derived from the schema key or `title` metadata. */
  label: string;
  /** Optional description text from `.describe()` or `.meta({ description })`. */
  description?: string;
  /** Optional help text from `FormMeta.helpText`, displayed below the input. */
  helpText?: string;
  /** Validation error message from RHF `formState.errors`, if present. */
  error?: string;
  /** Field path used as the `htmlFor` target on the label. */
  name: string;
  /** Whether the field is required (drives asterisk or `aria-required`). */
  required?: boolean;
  /** Whether the field is disabled (drives `disabled` on the wrapper). */
  disabled?: boolean;
  /** Whether the field is deprecated (drives strikethrough on the label). */
  deprecated?: boolean;
}

function DefaultFieldTemplate({
  children,
  label,
  description,
  helpText,
  error,
  name,
  deprecated,
  components
}: FieldTemplateProps & { components?: Partial<ComponentMap> }) {
  const { FieldLabel, FieldDescription, FieldMessage } = { ...defaultComponentMap, ...components };
  return (
    <>
      <FieldLabel htmlFor={name}>
        {deprecated ? <s>{label}</s> : label}
        {deprecated ? (
          <span aria-hidden="true" title="Deprecated">
            {' '}
            ⚠
          </span>
        ) : null}
        {deprecated ? <span className="sr-only"> (Deprecated)</span> : null}
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

function buildBaseComponentProps(
  field: FormField,
  errorMessage: string | undefined
): Record<string, unknown> {
  return {
    id: field.key,
    'aria-invalid': errorMessage ? 'true' : 'false',
    required: field.required,
    readOnly: field.readOnly,
    disabled: field.disabled
  };
}

// ─── Fieldset block for nested object fields ──────────────────────────

const FieldsetBlock = memo(function FieldsetBlock({
  field,
  components,
  componentConfig
}: FieldRendererProps) {
  const componentMap = { ...defaultComponentMap, ...components };
  const FieldComponent = componentMap.Field;

  const overrideComponentName = componentConfig?.fields?.[field.key]?.component;
  if (overrideComponentName && componentConfig?.componentModule) {
    const candidate = componentConfig.componentModule[overrideComponentName];
    if (isReactComponent(candidate)) {
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
    if (!_warned.has(`fieldset:${field.key}`)) {
      _warned.add(`fieldset:${field.key}`);
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

// ─── Array block with useFieldArray ───────────────────────────────────

/**
 * Serialize a value into a dedup key for set uniqueness checks.
 * Returns null for empty/nullish values (skip from comparison).
 * Falls back to a unique symbol-string on serialization failure so
 * unserializable values never match other values.
 *
 * @internal Exported for testing
 */
export function safeSerializeForDedup(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const t = typeof value;
  if (t === 'string') return `s:${value as string}`;
  if (t === 'number' || t === 'boolean') return `p:${String(value)}`;
  if (t === 'bigint') return `b:${(value as bigint).toString()}`;
  if (t === 'symbol' || t === 'function') return `u:${Symbol().toString()}${Math.random()}`;
  try {
    return `j:${JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? `__bigint:${v.toString()}` : v))}`;
  } catch {
    // Circular or otherwise unserializable — treat as unique to avoid false matches
    return `u:${Symbol().toString()}${Math.random()}`;
  }
}

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
  const { fields: items, append, remove, move } = useFieldArray({ control, name: field.key });
  const minLength = field.constraints.minLength ?? 0;
  const maxLength = field.constraints.maxLength;
  const isSet = field.props['_isSet'] === true;

  // Watch all values for set uniqueness validation (O(n) on change, fast for typical form sizes)
  const watchedValues: unknown[] | undefined = useWatch({
    control,
    name: field.key,
    disabled: !isSet
  });

  const AddButton = componentMap.ArrayAddButton;
  const RemoveButton = componentMap.ArrayRemoveButton;
  const ReorderHandle = componentMap.ArrayReorderHandle;

  // Resolve custom labels and editor primitives from field metadata (arrayConfig)
  const arrayConfig = field.props['_arrayConfig'] as
    | {
        addLabel?: string;
        removeLabel?: string;
        reorder?: boolean;
        onReorder?: (from: number, to: number) => void;
        before?: Array<{
          id: string;
          render: (ctx: { isFirst: boolean; isLast: boolean }) => unknown;
        }>;
        after?: Array<{
          id: string;
          render: (ctx: { isFirst: boolean; isLast: boolean }) => unknown;
        }>;
      }
    | undefined;
  const addLabel = arrayConfig?.addLabel;
  const removeLabel = arrayConfig?.removeLabel;
  const reorderEnabled = arrayConfig?.reorder === true;
  const onReorder = arrayConfig?.onReorder;
  const beforeRows = arrayConfig?.before;
  const afterRows = arrayConfig?.after;

  // One-time dev warning for duplicate ghost-row ids
  if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production') {
    for (const group of [beforeRows, afterRows]) {
      if (!group) continue;
      const seen = new Set<string>();
      for (const row of group) {
        if (seen.has(row.id) && !_warnedGhostIds.has(row.id)) {
          _warnedGhostIds.add(row.id);
          // eslint-disable-next-line no-console
          console.warn(
            `[zod-to-form] ArrayBlock: duplicate ghost-row id ${JSON.stringify(row.id)} ` +
              `detected. React reconciliation may misattribute state.`
          );
        }
        seen.add(row.id);
      }
    }
  }

  const handleReorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    move(from, to);
    onReorder?.(from, to);
  };

  // For sets: build a Set of stringified values for O(1) duplicate lookup.
  // Uses a safe serializer that handles BigInt/Symbol and falls back to a
  // non-matching key on serialization errors (so one bad value doesn't
  // break the whole check).
  const duplicateIndices = useMemo(() => {
    if (!isSet || !watchedValues) return new Set<number>();
    const seen = new Map<string, number>();
    const dupes = new Set<number>();
    for (let i = 0; i < watchedValues.length; i++) {
      const value = watchedValues[i];
      const key = safeSerializeForDedup(value);
      // Skip empty/nullish — users haven't filled these in yet
      if (key === null) continue;
      if (seen.has(key)) {
        dupes.add(i);
        dupes.add(seen.get(key)!);
      } else {
        seen.set(key, i);
      }
    }
    return dupes;
  }, [isSet, watchedValues]);

  return (
    <fieldset>
      <legend>{field.label}</legend>
      {beforeRows?.map((row, i) => (
        <div key={`ghost-before-${row.id}`}>
          {
            row.render({
              isFirst: i === 0,
              isLast: i === beforeRows.length - 1
            }) as ReactNode
          }
        </div>
      ))}
      {items.map((item, index) => {
        if (!field.arrayItem) return null;
        const itemField: FormField = { ...field.arrayItem, key: `${field.key}.${index}` };
        const isDuplicate = duplicateIndices.has(index);
        return (
          <div key={item.id}>
            <FieldRenderer
              field={itemField}
              components={componentMap}
              componentConfig={componentConfig}
            />
            {isDuplicate && (
              <span style={{ color: 'var(--destructive, #ef4444)', fontSize: '0.75rem' }}>
                Duplicate value
              </span>
            )}
            {reorderEnabled && ReorderHandle ? (
              <ReorderHandle index={index} total={items.length} onMove={handleReorder} />
            ) : null}
            <RemoveButton onClick={() => remove(index)} disabled={items.length <= minLength}>
              {removeLabel}
            </RemoveButton>
          </div>
        );
      })}
      {afterRows?.map((row, i) => (
        <div key={`ghost-after-${row.id}`}>
          {
            row.render({
              isFirst: i === 0,
              isLast: i === afterRows.length - 1
            }) as ReactNode
          }
        </div>
      ))}
      <AddButton
        onClick={() => append(getDefaultAppendValue(field.arrayItem))}
        disabled={maxLength != null && items.length >= maxLength}
      >
        {addLabel}
      </AddButton>
    </fieldset>
  );
});

// ─── Discriminated union block with watch ─────────────────────────────

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
  // TODO(L3): Re-enable watch mode for controlled components
  // const watchValidateFn = useWatchValidate(field);
  // When optimized validation is enabled, pass per-field rules to controller
  const controllerRules = (() => {
    // TODO(L3): if (watchValidateFn) return { validate: watchValidateFn };
    if (field.validation?.mode === 'native' && field.validation.rules) {
      return field.validation.rules;
    }
    const validate = zodSchemaValidate(field);
    return validate ? { validate } : undefined;
  })();
  const { field: controllerField } = useController({
    name: field.key,
    control,
    rules: controllerRules
  });

  // controllerField is ControllerRenderProps which extends Record<string, unknown>
  const resolved = resolveProps(
    controllerField as Record<string, unknown>,
    presetProps,
    fieldConfigProps
  );

  const componentProps: Record<string, unknown> = {
    ...buildBaseComponentProps(field, errorMessage),
    ...field.props,
    ...resolved
  };

  if (field.options) {
    componentProps['options'] = field.options;
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
  // TODO(L3): Re-enable useWatchValidate when L3 cross-field optimization is implemented
  // const watchValidate = useWatchValidate(field);
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

  // Resolve field template: componentModule['FieldTemplate'] → DefaultFieldTemplate fallback
  const customTemplate = componentConfig?.componentModule?.['FieldTemplate'];
  const FieldTemplate = (
    isReactComponent(customTemplate) ? customTemplate : DefaultFieldTemplate
  ) as typeof DefaultFieldTemplate;

  if (field.hidden) {
    return null;
  }

  // Fields with a section config are rendered by the section component, not individually
  if (mapping.override?.section) {
    return null;
  }

  const isControlled = mapping.componentOverride?.controlled === true;

  let fieldContent: ReactNode;

  const registerOpts = getRegisterOptions(field);
  // TODO(L3): Merge watch-mode validate when L3 cross-field optimization is implemented
  // if (watchValidate) { registerOpts['validate'] = watchValidate; }

  if (field.render) {
    const registration = register(field.key, registerOpts);
    const componentProps = {
      ...buildBaseComponentProps(field, errorMessage),
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
    const registration = register(field.key, registerOpts);
    const componentProps: Record<string, unknown> = {
      ...buildBaseComponentProps(field, errorMessage),
      ...field.props,
      ...mapping.override?.props,
      ...registration
    };
    if (field.options) {
      componentProps['options'] = field.options;
    }
    fieldContent = <Component {...componentProps} />;
  }

  const mergedFieldProps = { ...field.props, ...mapping.override?.props };
  const wrapperProps: Record<string, unknown> = {
    ...(mergedFieldProps['style'] ? { style: mergedFieldProps['style'] } : undefined),
    ...(mergedFieldProps['className'] ? { className: mergedFieldProps['className'] } : undefined)
  };

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
        components={components}
      >
        {fieldContent}
      </FieldTemplate>
    </FieldComponent>
  );
});

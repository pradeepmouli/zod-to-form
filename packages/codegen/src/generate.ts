import type { FormField } from '@zod-to-form/core';
import { getEmptyDefault } from '@zod-to-form/core';
import type { ComponentOverride, FieldConfig, ZodFormsConfig } from '@zod-to-form/core';
import { getFileHeader, renderField, registerPathExpr } from './templates.js';

export type CodegenConfig = {
  /** Optional pre-computed import path for the schema (e.g., './schema.js'). Defaults to './schema'. The CLI typically computes this from file paths; the browser playground can pass it explicitly. */
  schemaImportPath?: string;
  exportName: string;
  componentName: string;
  mode: 'submit' | 'auto-save';
  componentConfig?: ZodFormsConfig<Record<string, unknown>>;
  ui: 'shadcn' | 'html';
  /** @deprecated Currently unused. Reserved for future server action codegen support. */
  serverAction?: boolean;
  /** Force FormProvider wrapper in submit mode. Auto-save mode always uses FormProvider regardless. */
  formProvider?: boolean;
};

function renderLiteralProp(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const json = JSON.stringify(value);
    const inner = json.slice(1, -1);
    return `"${inner}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `{${String(value)}}`;
  }
  return undefined;
}

/** Known RHF field expressions that should be resolved, not rendered as literal props */
const RHF_FIELD_EXPRESSIONS = new Set([
  'field.value',
  'field.onChange',
  'field.onBlur',
  'field.ref',
  'field.name'
]);

function renderOverrideProps(props: Record<string, unknown> | undefined): string {
  if (!props) {
    return '';
  }

  const attrs = Object.entries(props)
    .map(([key, value]) => {
      // Skip RHF field expressions — they are resolved by resolvePropMap/renderControlledComponent
      if (typeof value === 'string' && RHF_FIELD_EXPRESSIONS.has(value)) {
        return '';
      }
      const rendered = renderLiteralProp(value);
      return rendered ? ` ${key}=${rendered}` : '';
    })
    .join('');

  return attrs;
}

function getMappedFieldComponent(
  field: FormField,
  componentConfig: ZodFormsConfig<Record<string, unknown>> | undefined
): {
  componentName?: string;
  override?: FieldConfig;
  componentOverride?: ComponentOverride;
  source: 'fields' | 'components' | 'none';
} {
  const mapping = resolveFieldMapping(field.key, field.component, componentConfig);

  if (!mapping.componentName) {
    return { source: mapping.source };
  }

  return {
    componentName: mapping.componentName,
    override: mapping.override,
    componentOverride: mapping.componentOverride,
    source: mapping.source
  };
}

function collectMappedComponentNames(
  fields: FormField[],
  componentConfig: ZodFormsConfig<Record<string, unknown>> | undefined,
  out = new Set<string>()
): Set<string> {
  for (const field of fields) {
    const mapping = getMappedFieldComponent(field, componentConfig);
    if (mapping.componentName && (mapping.componentOverride || mapping.override)) {
      out.add(mapping.componentName);
    }

    if (field.children?.length) {
      collectMappedComponentNames(field.children, componentConfig, out);
    }

    if (field.arrayItem) {
      collectMappedComponentNames([field.arrayItem], componentConfig, out);
    }
  }

  return out;
}

function renderFieldContainer(field: FormField, content: string, indent: string): string {
  const labelContent = field.deprecated
    ? `<s>${field.label}</s> <span title="Deprecated">⚠</span>`
    : field.label;
  const lines = [
    `${indent}<div>`,
    `${indent}  <label htmlFor="${field.key}">${labelContent}</label>`,
    `${indent}  ${content}`
  ];
  if (field.helpText) {
    lines.push(`${indent}  <p>${field.helpText}</p>`);
  }
  lines.push(`${indent}</div>`);
  return lines.join('\n');
}

function normalizeFieldKey(key: string): string {
  let result = key.replace(/\.(?:\d+|\$\{index\})\./g, '[].');
  result = result.replace(/\.(?:\d+|\$\{index\})$/, '[]');
  return result;
}

export function resolveFieldMapping<TComponents extends Record<string, unknown>>(
  fieldKey: string,
  componentName: string | undefined,
  componentConfig: ZodFormsConfig<TComponents> | undefined
): {
  componentOverride?: ComponentOverride;
  override?: FieldConfig;
  componentName?: string;
  source: 'fields' | 'components' | 'none';
} {
  if (!componentConfig) {
    return { source: 'none' };
  }

  const normalizedKey = normalizeFieldKey(fieldKey);
  const override = componentConfig.fields?.[fieldKey] ?? componentConfig.fields?.[normalizedKey];

  const resolvedComponent = override?.component ?? componentName;

  if (override) {
    return {
      componentName: resolvedComponent,
      componentOverride: resolvedComponent
        ? (componentConfig.components.overrides?.[resolvedComponent] as
            | ComponentOverride
            | undefined)
        : undefined,
      override,
      source: 'fields'
    };
  }

  if (resolvedComponent) {
    return {
      componentName: resolvedComponent,
      componentOverride: componentConfig.components.overrides?.[resolvedComponent] as
        | ComponentOverride
        | undefined,
      source: 'components'
    };
  }

  return { source: 'none' };
}

function toVarName(key: string): string {
  const parts = key.split(/[^a-zA-Z0-9]+/).filter((p) => p.length > 0);
  return parts
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

function collectArrayFields(fields: FormField[]): FormField[] {
  const result: FormField[] = [];
  for (const field of fields) {
    if (field.component === 'ArrayField' && !field.key.includes('.0.')) {
      result.push(field);
    }
    if (field.component === 'Fieldset' && field.children) {
      result.push(...collectArrayFields(field.children));
    }
  }
  return result;
}

function replaceArrayIndexToken(key: string, arrayKey: string): string {
  const prefix = `${arrayKey}.0`;
  if (key === prefix) {
    return `${arrayKey}.${'${index}'}`;
  }
  if (key.startsWith(`${prefix}.`)) {
    return `${arrayKey}.${'${index}'}.${key.slice(prefix.length + 1)}`;
  }
  return key;
}

function cloneFieldWithArrayIndex(field: FormField, arrayKey: string): FormField {
  return {
    ...field,
    key: replaceArrayIndexToken(field.key, arrayKey),
    children: field.children?.map((child) => cloneFieldWithArrayIndex(child, arrayKey)),
    arrayItem: field.arrayItem ? cloneFieldWithArrayIndex(field.arrayItem, arrayKey) : undefined
  };
}

function getDefaultArrayItemExpression(field: FormField | undefined): string {
  if (!field) {
    return `''`;
  }

  const value = getEmptyDefault(field);
  return serializeDefaultValue(value);
}

const charMap: Record<string, string> = {
  '<': '\\u003C',
  '>': '\\u003E',
  '/': '\\u002F',
  '\\': '\\\\',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\0': '\\0',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029'
};

function escapeUnsafeChars(str: string): string {
  return str.replace(/[<>/\\\b\f\n\r\t\0\u2028\u2029]/g, (x) => charMap[x] ?? x);
}

function serializeDefaultValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === '') return `''`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return escapeUnsafeChars(JSON.stringify(value));
  if (Array.isArray(value)) return '[]';
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => `${escapeUnsafeChars(JSON.stringify(k))}: ${serializeDefaultValue(v)}`)
      .join(', ');
    return `{ ${entries} }`;
  }
  return escapeUnsafeChars(JSON.stringify(value));
}

function renderNestedBlock(
  field: FormField,
  componentConfig: ZodFormsConfig<Record<string, unknown>> | undefined,
  indent: string
): string {
  const children = (field.children ?? [])
    .map((child) => renderFieldBlockWithConfig(child, componentConfig, `${indent}  `))
    .join('\n');

  return [
    `${indent}<div>`,
    `${indent}  <label>${field.label}</label>`,
    `${indent}  <fieldset>`,
    `${indent}    <legend>${field.label}</legend>`,
    children,
    `${indent}  </fieldset>`,
    `${indent}</div>`
  ].join('\n');
}

function renderArrayBlock(
  field: FormField,
  componentConfig: ZodFormsConfig<Record<string, unknown>> | undefined,
  indent: string
): string {
  if (field.key.includes('${')) {
    return [
      `${indent}<div>`,
      `${indent}  <label>${field.label}</label>`,
      `${indent}  <p>Nested array editing is not auto-generated for dynamic paths. Use a custom renderer for ${field.key}.</p>`,
      `${indent}</div>`
    ].join('\n');
  }

  const varName = toVarName(field.key);
  const itemField = field.arrayItem;
  const indexedItemField = itemField ? cloneFieldWithArrayIndex(itemField, field.key) : undefined;
  const mappedItem = indexedItemField
    ? getMappedFieldComponent(indexedItemField, componentConfig)
    : { source: 'none' as const };
  let itemJsx: string;
  if (!indexedItemField) {
    itemJsx = `${indent}      <input {...${registerPathExpr(`${field.key}.\${index}`)}} />`;
  } else if (
    mappedItem.source === 'fields' &&
    mappedItem.componentName &&
    mappedItem.componentOverride?.controlled
  ) {
    const overrideProps = renderOverrideProps(mappedItem.override?.props);
    const propMap = resolvePropMap(mappedItem.componentOverride, mappedItem.override);
    itemJsx = renderControlledComponent(
      indexedItemField.key,
      mappedItem.componentName,
      propMap,
      overrideProps
    );
  } else if (mappedItem.source === 'fields' && mappedItem.componentName) {
    itemJsx = `<${mappedItem.componentName} {...${registerPathExpr(indexedItemField.key)}}${renderOverrideProps(mappedItem.override?.props)} />`;
  } else {
    itemJsx = renderFieldBlockWithConfig(indexedItemField, componentConfig, `${indent}      `);
  }

  return [
    `${indent}<div>`,
    `${indent}  <label>${field.label}</label>`,
    `${indent}  {${varName}Fields.map((item, index) => (`,
    `${indent}    <div key={item.id}>`,
    itemJsx,
    `${indent}      <button type="button" onClick={() => remove${capitalize(varName)}(index)}>Remove</button>`,
    `${indent}    </div>`,
    `${indent}  ))}`,
    `${indent}  <button type="button" onClick={() => append${capitalize(varName)}(${getDefaultArrayItemExpression(itemField)})}>Add</button>`,
    `${indent}</div>`
  ].join('\n');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function resolvePropMap(
  componentOverride?: ComponentOverride,
  override?: FieldConfig
): Record<string, string> | undefined {
  const entryMap = componentOverride?.props as Record<string, string> | undefined;
  const fieldMap = override?.props as Record<string, string> | undefined;
  function filterRhfProps(
    map: Record<string, string> | undefined
  ): Record<string, string> | undefined {
    if (!map) return undefined;
    const filtered: Record<string, string> = {};
    let hasAny = false;
    for (const [k, v] of Object.entries(map)) {
      if (typeof v === 'string' && RHF_FIELD_EXPRESSIONS.has(v)) {
        filtered[k] = v;
        hasAny = true;
      }
    }
    return hasAny ? filtered : undefined;
  }
  const filteredEntry = filterRhfProps(entryMap);
  const filteredField = filterRhfProps(fieldMap);
  if (!filteredEntry && !filteredField) return undefined;
  return { ...filteredEntry, ...filteredField };
}

function renderControlledComponent(
  fieldKey: string,
  componentName: string,
  propMap: Record<string, string> | undefined,
  overrideProps: string
): string {
  const defaultFieldProps: Record<string, string> = {
    value: 'field.value',
    onChange: 'field.onChange',
    onBlur: 'field.onBlur',
    ref: 'field.ref',
    name: 'field.name'
  };

  const finalProps: Record<string, string> = { ...defaultFieldProps };
  if (propMap) {
    const rhfTargets = new Set(Object.values(propMap));
    for (const [defaultProp, defaultExpr] of Object.entries(defaultFieldProps)) {
      if (rhfTargets.has(defaultExpr) && !(defaultProp in propMap)) {
        delete finalProps[defaultProp];
      }
    }
    for (const [componentProp, rhfExpr] of Object.entries(propMap)) {
      finalProps[componentProp] = rhfExpr;
    }
  }

  const propsStr = Object.entries(finalProps)
    .map(([prop, expr]) => `${prop}={${expr}}`)
    .join(' ');

  const nameExpr = fieldKey.includes('${') ? `\`${fieldKey}\`` : `"${fieldKey}"`;
  const idExpr = fieldKey.includes('${') ? `{${'`'}${fieldKey}${'`'}}` : `"${fieldKey}"`;

  return [
    `<Controller name={${nameExpr}} control={control} render={({ field }) => (`,
    `  <${componentName} id=${idExpr} ${propsStr}${overrideProps} />`,
    `)} />`
  ].join('\n');
}

function renderMappedComponent(
  field: FormField,
  componentName: string,
  componentOverride: ComponentOverride | undefined,
  override: FieldConfig | undefined,
  overrideProps: string
): string {
  if (componentOverride?.controlled) {
    const propMap = resolvePropMap(componentOverride, override);
    return renderControlledComponent(field.key, componentName, propMap, overrideProps);
  }
  return `<${componentName} id="${field.key}" {...${registerPathExpr(field.key)}}${overrideProps} />`;
}

function renderFieldBlockWithConfig(
  field: FormField,
  componentConfig: ZodFormsConfig<Record<string, unknown>> | undefined,
  indent = '      '
): string {
  const mapping = getMappedFieldComponent(field, componentConfig);
  if (field.hasCustomRender) {
    return [
      `${indent}<div>`,
      `${indent}  <label htmlFor="${field.key}">${field.label}</label>`,
      `${indent}  {/* TODO: custom renderer for ${field.key} — replace with your component */}`,
      `${indent}</div>`
    ].join('\n');
  }

  if (mapping.source === 'fields' && mapping.componentName) {
    const overrideProps = renderOverrideProps(mapping.override?.props);
    let content: string;
    content = renderMappedComponent(
      field,
      mapping.componentName,
      mapping.componentOverride,
      mapping.override,
      overrideProps
    );
    return renderFieldContainer(field, content, indent);
  }

  if (field.component === 'Fieldset') {
    return renderNestedBlock(field, componentConfig, indent);
  }

  if (field.component === 'ArrayField') {
    return renderArrayBlock(field, componentConfig, indent);
  }

  if (mapping.componentName && (mapping.componentOverride || mapping.override)) {
    const overrideProps = renderOverrideProps(mapping.override?.props);
    const content = renderMappedComponent(
      field,
      mapping.componentName,
      mapping.componentOverride,
      mapping.override,
      overrideProps
    );
    return renderFieldContainer(field, content, indent);
  }

  return renderFieldContainer(field, renderField(field), indent);
}

function hasControlledFields(
  fields: FormField[],
  componentConfig: ZodFormsConfig<Record<string, unknown>> | undefined
): boolean {
  if (!componentConfig) return false;
  for (const field of fields) {
    const mapping = resolveFieldMapping(field.key, field.component, componentConfig);
    if (mapping.componentOverride?.controlled) return true;
    if (field.children?.length && hasControlledFields(field.children, componentConfig)) return true;
    if (field.arrayItem && hasControlledFields([field.arrayItem], componentConfig)) return true;
  }
  return false;
}

export function generateFormComponent(fields: FormField[], config: CodegenConfig): string {
  const schemaImportPath = config.schemaImportPath ?? './schema';
  const arrayFields = collectArrayFields(fields);
  const hasArrays = arrayFields.length > 0;
  const useFormProvider = config.formProvider || config.mode === 'auto-save';
  const hasControlled = hasControlledFields(fields, config.componentConfig);

  const mappedComponents = collectMappedComponentNames(fields, config.componentConfig);
  const importNames = new Set<string>(mappedComponents);

  const componentImportLine =
    config.componentConfig && importNames.size > 0
      ? `import { ${Array.from(importNames).sort().join(', ')} } from '${config.componentConfig.components.source}';`
      : undefined;

  const preset =
    config.componentConfig?.components?.preset ?? (config.ui === 'shadcn' ? 'shadcn' : 'html');

  const header = getFileHeader(
    schemaImportPath,
    config.exportName,
    hasArrays,
    config.mode,
    componentImportLine,
    { hasControlled, formProvider: useFormProvider, preset }
  );
  const body = fields
    .map((field) => renderFieldBlockWithConfig(field, config.componentConfig, '      '))
    .join('\n');

  const arrayHooks = arrayFields
    .map((f) => {
      const varName = toVarName(f.key);
      return `  const { fields: ${varName}Fields, append: append${capitalize(varName)}, remove: remove${capitalize(varName)} } = useFieldArray<FormData, '${f.key}'>({ control, name: '${f.key}' });`;
    })
    .join('\n');

  const destructureParts: string[] = ['register'];
  if (config.mode === 'auto-save') {
    destructureParts.push('watch');
  } else {
    destructureParts.push('handleSubmit');
  }
  if (hasArrays || hasControlled) {
    destructureParts.push('control');
  }
  const useFormDestructure = `{ ${destructureParts.join(', ')} }`;

  const propsLines: string[] = [];
  if (config.mode === 'auto-save') {
    propsLines.push(`  onValueChange?: (data: FormData) => void;`);
    propsLines.push(`  onSubmit?: (data: FormData) => void;`);
  } else {
    propsLines.push(`  onSubmit: (data: FormData) => void;`);
  }
  propsLines.push(`  defaultValues?: Partial<FormData>;`);
  propsLines.push(`  values?: FormData;`);

  const autoSaveEffect =
    config.mode === 'auto-save'
      ? [
          `  useEffect(() => {`,
          `    const subscription = watch((values) => {`,
          `      props.onValueChange?.(values as FormData);`,
          `    });`,
          ``,
          `    return () => subscription.unsubscribe();`,
          `  }, [watch, props.onValueChange]);`,
          ``
        ]
      : [];

  const formOpen =
    config.mode === 'auto-save'
      ? `    <form>`
      : `    <form onSubmit={handleSubmit(props.onSubmit)}>`;

  const formTail =
    config.mode === 'auto-save' ? [] : [`      <button type="submit">Submit</button>`];

  const formContent = [formOpen, body, ...formTail, `    </form>`];

  const wrappedContent = useFormProvider
    ? [
        `    <FormProvider {...form}>`,
        ...formContent.map((line) => (line ? `  ${line}` : line)),
        `    </FormProvider>`
      ]
    : formContent;

  return [
    header,
    '',
    `export function ${config.componentName}(props: {`,
    ...propsLines,
    `}) {`,
    ...(preset === 'shadcn'
      ? [`  const form = useForm<FormData>({`, `    resolver: zodResolver(${config.exportName}),`]
      : [
          `  const baseResolver = zodResolver(${config.exportName});`,
          `  const form = useForm<FormData>({`,
          `    resolver: (values: unknown, ctx: unknown, opts: unknown) => baseResolver(normalizeFormValues(values) as FormData, ctx, opts),`
        ]),
    ...(config.mode === 'auto-save' ? [`    mode: 'onChange',`] : []),
    `    defaultValues: props.defaultValues,`,
    `    values: props.values,`,
    `  });`,
    `  const ${useFormDestructure} = form;`,
    ...(hasArrays ? [arrayHooks] : []),
    ...autoSaveEffect,
    '',
    `  return (`,
    ...wrappedContent,
    `  );`,
    `}`
  ].join('\n');
}

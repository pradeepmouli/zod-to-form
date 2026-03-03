import path from 'node:path';
import type { FormField } from '@zod-to-form/core';
import type { ComponentEntry, FieldOverride, ZodToFormComponentConfig } from './index.js';
import { getFileHeader, renderField } from './templates.js';

export type CodegenConfig = {
  schemaPath: string;
  exportName: string;
  outputPath: string;
  componentName: string;
  mode: 'submit' | 'auto-save';
  componentConfig?: ZodToFormComponentConfig<Record<string, unknown>>;
  ui: 'shadcn' | 'unstyled';
  serverAction: boolean;
};

function renderLiteralProp(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `{${String(value)}}`;
  }
  return undefined;
}

function renderOverrideProps(props: Record<string, unknown> | undefined): string {
  if (!props) {
    return '';
  }

  const attrs = Object.entries(props)
    .map(([key, value]) => {
      const rendered = renderLiteralProp(value);
      return rendered ? ` ${key}=${rendered}` : '';
    })
    .join('');

  return attrs;
}

function getMappedFieldComponent(
  field: FormField,
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined
): {
  componentName?: string;
  override?: FieldOverride;
} {
  const mapping = resolveFieldMapping(field.key, field.component, componentConfig);

  if (!mapping.entry) {
    return {};
  }

  return {
    componentName: mapping.entry.component,
    override: mapping.override
  };
}

function collectMappedComponentNames(
  fields: FormField[],
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined,
  out = new Set<string>()
): Set<string> {
  for (const field of fields) {
    const mapping = getMappedFieldComponent(field, componentConfig);
    if (mapping.componentName) {
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

export function resolveFieldMapping<TComponents extends Record<string, unknown>>(
  fieldKey: string,
  fieldType: string | undefined,
  componentConfig: ZodToFormComponentConfig<TComponents> | undefined
): {
  entry?: ComponentEntry<TComponents>;
  override?: FieldOverride;
  source: 'fields' | 'fieldTypes' | 'none';
} {
  if (!componentConfig) {
    return { source: 'none' };
  }

  const override = componentConfig.fields?.[fieldKey];
  if (override) {
    return {
      entry: componentConfig.fieldTypes[override.fieldType],
      override,
      source: 'fields'
    };
  }

  if (fieldType && componentConfig.fieldTypes[fieldType]) {
    return {
      entry: componentConfig.fieldTypes[fieldType],
      source: 'fieldTypes'
    };
  }

  return { source: 'none' };
}

function getSchemaImportPath(config: CodegenConfig): string {
  const relative = path
    .relative(path.dirname(config.outputPath), config.schemaPath)
    .replace(/\\/g, '/');

  const withDot = relative.startsWith('.') ? relative : `./${relative}`;
  return withDot
    .replace(/\.mts$/i, '.mjs')
    .replace(/\.cts$/i, '.cjs')
    .replace(/\.tsx?$/i, '.js');
}

/** Convert a field key to a safe camelCase variable prefix (e.g. 'address.street' → 'addressStreet') */
function toVarName(key: string): string {
  return key.replace(/[^a-zA-Z0-9]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** Collect all array fields (recursively through nested objects) */
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

function getObjectPropertyName(path: string): string {
  const lastSegment = path.split('.').at(-1) ?? path;
  return JSON.stringify(lastSegment);
}

function getDefaultArrayItemExpression(field: FormField | undefined): string {
  if (!field) {
    return `''`;
  }

  if (field.defaultValue !== undefined) {
    return JSON.stringify(field.defaultValue);
  }

  if (field.options && field.options.length > 0) {
    return JSON.stringify(field.options[0]!.value);
  }

  if (field.component === 'Checkbox' || field.component === 'Switch') {
    return 'false';
  }

  if (field.component === 'Input') {
    const inputType = typeof field.props['type'] === 'string' ? field.props['type'] : 'text';
    if (inputType === 'number') {
      return '0';
    }
    if (inputType === 'checkbox') {
      return 'false';
    }
  }

  if (field.component === 'Fieldset') {
    const children = field.children ?? [];
    if (children.length === 0) {
      return '{}';
    }

    const entries = children
      .map(
        (child) => `${getObjectPropertyName(child.key)}: ${getDefaultArrayItemExpression(child)}`
      )
      .join(', ');

    return `{ ${entries} }`;
  }

  if (field.component === 'ArrayField') {
    return '[]';
  }

  if (field.zodType === 'number' || field.zodType === 'bigint') {
    return '0';
  }

  if (field.zodType === 'boolean') {
    return 'false';
  }

  return `''`;
}

function renderNestedBlock(
  field: FormField,
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined,
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
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined,
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
    : {};
  const itemJsx = indexedItemField
    ? mappedItem.componentName
      ? `<${mappedItem.componentName} {...register(\`${indexedItemField.key}\`)}${renderOverrideProps(mappedItem.override?.props)} />`
      : renderFieldBlockWithConfig(indexedItemField, componentConfig, `${indent}      `)
    : `${indent}      <input {...register(\`${field.key}.\${index}\`)} />`;

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

function renderFieldBlockWithConfig(
  field: FormField,
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined,
  indent = '      '
): string {
  const mapping = getMappedFieldComponent(field, componentConfig);

  if (field.hasCustomRender) {
    const styleAttr = field.gridColumn ? ` style={{ gridColumn: '${field.gridColumn}' }}` : '';
    return [
      `${indent}<div${styleAttr}>`,
      `${indent}  <label htmlFor="${field.key}">${field.label}</label>`,
      `${indent}  {/* TODO: custom renderer for ${field.key} — replace with your component */}`,
      `${indent}</div>`
    ].join('\n');
  }

  if (field.component === 'Fieldset') {
    return renderNestedBlock(field, componentConfig, indent);
  }

  if (field.component === 'ArrayField') {
    return renderArrayBlock(field, componentConfig, indent);
  }

  if (mapping.componentName) {
    const styleAttr = field.gridColumn ? ` style={{ gridColumn: '${field.gridColumn}' }}` : '';
    const overrideProps = renderOverrideProps(mapping.override?.props);

    return [
      `${indent}<div${styleAttr}>`,
      `${indent}  <label htmlFor="${field.key}">${field.label}</label>`,
      `${indent}  <${mapping.componentName} id="${field.key}" {...${field.key.includes('${') ? `register(\`${field.key}\`)` : `register('${field.key}')`}}${overrideProps} />`,
      `${indent}</div>`
    ].join('\n');
  }

  const styleAttr = field.gridColumn ? ` style={{ gridColumn: '${field.gridColumn}' }}` : '';

  return [
    `${indent}<div${styleAttr}>`,
    `${indent}  <label htmlFor="${field.key}">${field.label}</label>`,
    `${indent}  ${renderField(field)}`,
    `${indent}</div>`
  ].join('\n');
}

export async function generateFormComponent(
  fields: FormField[],
  config: CodegenConfig
): Promise<string> {
  const schemaImportPath = getSchemaImportPath(config);
  const arrayFields = collectArrayFields(fields);
  const hasArrays = arrayFields.length > 0;

  const mappedComponents = collectMappedComponentNames(fields, config.componentConfig);

  const componentImportLine =
    config.componentConfig && mappedComponents.size > 0
      ? `import { ${Array.from(mappedComponents).sort().join(', ')} } from '${config.componentConfig.components}';`
      : undefined;

  const header = getFileHeader(
    schemaImportPath,
    config.exportName,
    hasArrays,
    config.mode,
    componentImportLine
  );
  const body = fields
    .map((field) => renderFieldBlockWithConfig(field, config.componentConfig, '      '))
    .join('\n');

  // useFieldArray hook declarations
  const arrayHooks = arrayFields
    .map((f) => {
      const varName = toVarName(f.key);
      return `  const { fields: ${varName}Fields, append: append${capitalize(varName)}, remove: remove${capitalize(varName)} } = useFieldArray<FormData, '${f.key}'>({ control, name: '${f.key}' });`;
    })
    .join('\n');

  const useFormDestructure =
    config.mode === 'auto-save'
      ? hasArrays
        ? `{ register, watch, control }`
        : `{ register, watch }`
      : hasArrays
        ? `{ register, handleSubmit, control }`
        : `{ register, handleSubmit }`;

  const propsLines =
    config.mode === 'auto-save'
      ? [`  onValueChange?: (data: FormData) => void;`, `  onSubmit?: (data: FormData) => void;`]
      : [`  onSubmit: (data: FormData) => void;`];

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

  return [
    header,
    '',
    `export function ${config.componentName}(props: {`,
    ...propsLines,
    `}) {`,
    `  const ${useFormDestructure} = useForm<FormData>({`,
    `    resolver: zodResolver(${config.exportName}),`,
    ...(config.mode === 'auto-save' ? [`    mode: 'onChange'`] : []),
    `  });`,
    ...(hasArrays ? [arrayHooks] : []),
    ...autoSaveEffect,
    '',
    `  return (`,
    formOpen,
    body,
    ...formTail,
    `    </form>`,
    `  );`,
    `}`
  ].join('\n');
}

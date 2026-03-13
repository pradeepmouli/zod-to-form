import path from 'node:path';
import type { FormField } from '@zod-to-form/core';
import { getEmptyDefault } from '@zod-to-form/core';
import type {
  ComponentEntry,
  FieldConfig,
  FieldOverride,
  FormPrimitivesConfig,
  ZodToFormComponentConfig
} from './index.js';
import { getFileHeader, renderField } from './templates.js';

export type SectionConfig = {
  title: string;
  description?: string;
  fields: string[];
};

export type CodegenConfig = {
  schemaPath: string;
  exportName: string;
  outputPath: string;
  componentName: string;
  mode: 'submit' | 'auto-save';
  componentConfig?: ZodToFormComponentConfig<Record<string, unknown>>;
  ui: 'shadcn' | 'unstyled';
  serverAction: boolean;
  /** Wrap generated form in <FormProvider {...form}> */
  formProvider?: boolean;
  /** Top-level section groupings keyed by section name */
  sections?: Record<string, SectionConfig>;
};

function renderLiteralProp(value: unknown): string | undefined {
  if (typeof value === 'string') {
    // Escape backslashes first, then double quotes to produce a valid JS string literal
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
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
  entry?: ComponentEntry<Record<string, unknown>>;
  source: 'fields' | 'fieldTypes' | 'none';
} {
  const mapping = resolveFieldMapping(field.key, field.component, componentConfig);

  if (!mapping.entry) {
    return { source: mapping.source };
  }

  return {
    componentName: mapping.entry.component,
    override: mapping.override,
    entry: mapping.entry,
    source: mapping.source
  };
}

function collectMappedComponentNames(
  fields: FormField[],
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined,
  out = new Set<string>()
): Set<string> {
  for (const field of fields) {
    if (isFieldHidden(field, componentConfig)) continue;

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

function collectFormPrimitiveNames(
  primitives: FormPrimitivesConfig<Record<string, unknown>> | undefined
): Set<string> {
  const names = new Set<string>();
  if (!primitives) {
    return names;
  }

  if (primitives.field) {
    names.add(primitives.field);
  }

  if (primitives.label) {
    names.add(primitives.label);
  }

  if (primitives.control) {
    names.add(primitives.control);
  }

  return names;
}

function renderFieldContainer(
  field: FormField,
  content: string,
  indent: string,
  primitives: FormPrimitivesConfig<Record<string, unknown>> | undefined
): string {
  const styleAttr = field.gridColumn ? ` style={{ gridColumn: '${field.gridColumn}' }}` : '';
  const fieldTag = primitives?.field;
  const labelTag = primitives?.label;
  const controlTag = primitives?.control;

  if (!fieldTag && !labelTag && !controlTag) {
    return [
      `${indent}<div${styleAttr}>`,
      `${indent}  <label htmlFor="${field.key}">${field.label}</label>`,
      `${indent}  ${content}`,
      `${indent}</div>`
    ].join('\n');
  }

  const openField = fieldTag ? `<${fieldTag}${styleAttr}>` : `<div${styleAttr}>`;
  const closeField = fieldTag ? `</${fieldTag}>` : `</div>`;
  const openLabel = labelTag
    ? `<${labelTag} htmlFor="${field.key}">`
    : `<label htmlFor="${field.key}">`;
  const closeLabel = labelTag ? `</${labelTag}>` : `</label>`;

  if (!controlTag) {
    return [
      `${indent}${openField}`,
      `${indent}  ${openLabel}${field.label}${closeLabel}`,
      `${indent}  ${content}`,
      `${indent}${closeField}`
    ].join('\n');
  }

  return [
    `${indent}${openField}`,
    `${indent}  ${openLabel}${field.label}${closeLabel}`,
    `${indent}  <${controlTag}>`,
    `${indent}    ${content}`,
    `${indent}  </${controlTag}>`,
    `${indent}${closeField}`
  ].join('\n');
}

/**
 * Normalise a concrete field key (e.g. `attributes.0.typeCall.type` or
 * `attributes.${index}.typeCall.type`) to the bracket notation used in
 * the user-facing `fields` config (e.g. `attributes[].typeCall.type`).
 */
function normalizeFieldKey(key: string): string {
  // Replace `.0.` or `.${index}.` segments with `[].`
  let result = key.replace(/\.(?:0|\$\{index\})\./g, '[].');
  // Replace trailing `.0` or `.${index}`
  result = result.replace(/\.(?:0|\$\{index\})$/, '[]');
  return result;
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

  // Try exact match first, then normalised bracket-notation match
  const override =
    componentConfig.fields?.[fieldKey] ?? componentConfig.fields?.[normalizeFieldKey(fieldKey)];
  if (override) {
    return {
      entry: override.fieldType ? componentConfig.fieldTypes[override.fieldType] : undefined,
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

/** Collect all array fields (recursively through nested objects), skipping hidden fields */
function collectArrayFields(
  fields: FormField[],
  componentConfig?: ZodToFormComponentConfig<Record<string, unknown>>
): FormField[] {
  const result: FormField[] = [];
  for (const field of fields) {
    if (isFieldHidden(field, componentConfig)) continue;
    if (field.component === 'ArrayField' && !field.key.includes('.0.')) {
      result.push(field);
    }
    if (field.component === 'Fieldset' && field.children) {
      result.push(...collectArrayFields(field.children, componentConfig));
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
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined,
  primitives: FormPrimitivesConfig<Record<string, unknown>> | undefined,
  indent: string
): string {
  const children = (field.children ?? [])
    .map((child) => renderFieldBlockWithConfig(child, componentConfig, primitives, `${indent}  `))
    .filter(Boolean)
    .join('\n');

  if (!children) return '';

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
  primitives: FormPrimitivesConfig<Record<string, unknown>> | undefined,
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
    itemJsx = `${indent}      <input {...register(\`${field.key}.\${index}\`)} />`;
  } else if (mappedItem.componentName && mappedItem.entry?.controlled) {
    const overrideProps = renderOverrideProps(mappedItem.override?.props);
    const propMap = resolvePropMap(mappedItem.entry, mappedItem.override);
    itemJsx = renderControlledComponent(
      indexedItemField.key,
      mappedItem.componentName,
      propMap,
      overrideProps
    );
  } else if (mappedItem.componentName) {
    itemJsx = `<${mappedItem.componentName} {...register(\`${indexedItemField.key}\`)}${renderOverrideProps(mappedItem.override?.props)} />`;
  } else {
    itemJsx = renderFieldBlockWithConfig(
      indexedItemField,
      componentConfig,
      primitives,
      `${indent}      `
    );
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

/**
 * Merge component-level propMap with per-field propMap override.
 * Per-field entries win when keys overlap.
 */
function resolvePropMap(
  entry?: ComponentEntry<Record<string, unknown>>,
  override?: FieldOverride
): Record<string, string> | undefined {
  const entryMap = entry?.propMap;
  const fieldMap = override?.propMap;
  if (!entryMap && !fieldMap) return undefined;
  return { ...entryMap, ...fieldMap };
}

/**
 * Render a controlled component using <Controller> with propMap applied.
 *
 * Default RHF field props: value, onChange, onBlur, ref, name
 * propMap remaps these: e.g. { onSelect: 'field.onChange' } means
 * the component receives `onSelect={field.onChange}` instead of `onChange={field.onChange}`.
 */
function renderControlledComponent(
  fieldKey: string,
  componentName: string,
  propMap: Record<string, string> | undefined,
  overrideProps: string
): string {
  // Default RHF field prop mappings
  const defaultFieldProps: Record<string, string> = {
    value: 'field.value',
    onChange: 'field.onChange',
    onBlur: 'field.onBlur',
    ref: 'field.ref',
    name: 'field.name'
  };

  // Build the final prop wiring: start with defaults, apply propMap remapping
  const finalProps: Record<string, string> = { ...defaultFieldProps };
  if (propMap) {
    // propMap maps componentPropName → RHF field expression
    // e.g. { onSelect: 'field.onChange', value: 'field.value' }
    // First, remove default props that are being remapped away
    const rhfTargets = new Set(Object.values(propMap));
    for (const [defaultProp, defaultExpr] of Object.entries(defaultFieldProps)) {
      if (rhfTargets.has(defaultExpr) && !(defaultProp in propMap)) {
        delete finalProps[defaultProp];
      }
    }
    // Then add the remapped props
    for (const [componentProp, rhfExpr] of Object.entries(propMap)) {
      // Remove any default that would conflict with this component prop name
      if (componentProp in finalProps && !(componentProp in propMap)) {
        // Already handled
      }
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

function isFieldHidden(
  field: FormField,
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined
): boolean {
  // Check schema-level .meta({ hidden: true })
  if (field.hidden) return true;
  // Check config fields[path].hidden
  if (!componentConfig?.fields) return false;
  const override =
    componentConfig.fields[field.key] ?? componentConfig.fields[normalizeFieldKey(field.key)];
  if (override?.hidden === true) return true;
  // Fields with a section are rendered by the section component, not individually
  if (override?.section) return true;
  return false;
}

/**
 * Collect section groupings from the config.
 * Returns a Map of section component name → array of field keys that belong to it.
 */
function collectSections(
  fields: FormField[],
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined
): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  if (!componentConfig?.fields) return sections;

  const visitField = (field: FormField): void => {
    const override =
      componentConfig!.fields![field.key] ?? componentConfig!.fields![normalizeFieldKey(field.key)];

    const hasSection = override?.section !== undefined;

    // Always allow fields that define a section to be collected into that section,
    // even if they are schema-hidden or config-hidden. For non-section fields,
    // skip adding them to any section if they are hidden.
    if (hasSection) {
      const sectionName = override!.section as string;
      const existing = sections.get(sectionName);
      if (existing) {
        existing.push(field.key);
      } else {
        sections.set(sectionName, [field.key]);
      }
    }

    // Recurse into nested fields (fieldset children and array items) so that
    // sections configured on nested fields are also collected.
    if (Array.isArray((field as any).children) && (field as any).children.length > 0) {
      for (const child of (field as any).children as FormField[]) {
        visitField(child);
      }
    }

    if ((field as any).arrayItem) {
      visitField((field as any).arrayItem as FormField);
    }
  };

  for (const field of fields) {
    visitField(field);
  }

  return sections;
}

/**
 * Render section components that group multiple fields.
 * Each section component receives a `fields` prop with the field names it should bind to.
 */
function renderSections(sections: Map<string, string[]>, indent: string): string {
  if (sections.size === 0) return '';

  const blocks: string[] = [];
  for (const [componentName, fieldKeys] of sections) {
    const fieldsArrayStr = fieldKeys.map((k) => `'${k}'`).join(', ');
    blocks.push(`${indent}<${componentName} fields={[${fieldsArrayStr}]} />`);
  }
  return blocks.join('\n');
}

function renderFieldBlockWithConfig(
  field: FormField,
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined,
  primitives: FormPrimitivesConfig<Record<string, unknown>> | undefined,
  indent = '      '
): string {
  if (isFieldHidden(field, componentConfig)) {
    return '';
  }

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

  // If a fields override maps this nested/array field to a custom component,
  // render that component instead of expanding children.
  if (mapping.source === 'fields' && mapping.componentName) {
    const overrideProps = renderOverrideProps(mapping.override?.props);
    let content: string;
    if (mapping.entry?.controlled) {
      const propMap = resolvePropMap(mapping.entry, mapping.override);
      content = renderControlledComponent(field.key, mapping.componentName, propMap, overrideProps);
    } else {
      const regExpr = field.key.includes('${')
        ? `register(\`${field.key}\`)`
        : `register('${field.key}')`;
      content = `<${mapping.componentName} id="${field.key}" {...${regExpr}}${overrideProps} />`;
    }
    return renderFieldContainer(field, content, indent, primitives);
  }

  if (field.component === 'Fieldset') {
    return renderNestedBlock(field, componentConfig, primitives, indent);
  }

  if (field.component === 'ArrayField') {
    return renderArrayBlock(field, componentConfig, primitives, indent);
  }

  if (mapping.componentName) {
    const overrideProps = renderOverrideProps(mapping.override?.props);
    let content: string;
    if (mapping.entry?.controlled) {
      const propMap = resolvePropMap(mapping.entry, mapping.override);
      content = renderControlledComponent(field.key, mapping.componentName, propMap, overrideProps);
    } else {
      content = `<${mapping.componentName} id="${field.key}" {...${field.key.includes('${') ? `register(\`${field.key}\`)` : `register('${field.key}')`}}${overrideProps} />`;
    }
    return renderFieldContainer(field, content, indent, primitives);
  }

  return renderFieldContainer(field, renderField(field), indent, primitives);
}

/** Check if any field in the tree uses a controlled component entry */
function hasControlledFields(
  fields: FormField[],
  componentConfig: ZodToFormComponentConfig<Record<string, unknown>> | undefined
): boolean {
  if (!componentConfig) return false;
  for (const field of fields) {
    const mapping = resolveFieldMapping(field.key, field.component, componentConfig);
    if (mapping.entry?.controlled) return true;
    if (field.children?.length && hasControlledFields(field.children, componentConfig)) return true;
    if (field.arrayItem && hasControlledFields([field.arrayItem], componentConfig)) return true;
  }
  return false;
}

export async function generateFormComponent(
  fields: FormField[],
  config: CodegenConfig
): Promise<string> {
  const schemaImportPath = getSchemaImportPath(config);
  const arrayFields = collectArrayFields(fields, config.componentConfig);
  const hasArrays = arrayFields.length > 0;
  const formPrimitives = config.componentConfig?.formPrimitives;
  const useFormProvider = config.formProvider || config.mode === 'auto-save';
  const hasControlled = hasControlledFields(fields, config.componentConfig);

  // Collect section groupings
  const sections = collectSections(fields, config.componentConfig);

  const mappedComponents = collectMappedComponentNames(fields, config.componentConfig);
  const primitiveComponents = collectFormPrimitiveNames(formPrimitives);
  const importNames = new Set<string>([...mappedComponents, ...primitiveComponents]);

  // Add section component names to imports
  for (const sectionName of sections.keys()) {
    importNames.add(sectionName);
  }

  const componentImportLine =
    config.componentConfig && importNames.size > 0
      ? `import { ${Array.from(importNames).sort().join(', ')} } from '${config.componentConfig.components}';`
      : undefined;

  const header = getFileHeader(
    schemaImportPath,
    config.exportName,
    hasArrays,
    config.mode,
    componentImportLine,
    { hasControlled, formProvider: useFormProvider }
  );
  // When top-level sections are configured, group fields inside <section> HTML elements.
  let body: string;
  if (config.sections && Object.keys(config.sections).length > 0) {
    const topLevelSections = config.sections;
    // Build field-key → section-key mapping (normalize array indices for matching)
    const fieldToSectionKey = new Map<string, string>();
    for (const sectionKey of Object.keys(topLevelSections)) {
      for (const fk of topLevelSections[sectionKey]!.fields) {
        fieldToSectionKey.set(fk, sectionKey);
      }
    }

    const renderedParts: string[] = [];
    const emittedSections = new Set<string>();
    const fieldIndent = '      ';
    const innerIndent = fieldIndent + '  ';

    for (const field of fields) {
      const sectionKey =
        fieldToSectionKey.get(field.key) ?? fieldToSectionKey.get(normalizeFieldKey(field.key));

      if (sectionKey && !emittedSections.has(sectionKey)) {
        emittedSections.add(sectionKey);
        const sectionDef = topLevelSections[sectionKey]!;

        // Collect all fields belonging to this section (preserving order from sectionDef.fields)
        const sectionFieldKeys = new Set(sectionDef.fields.map((k) => normalizeFieldKey(k)));
        sectionFieldKeys.add(sectionKey); // keep original keys too
        for (const fk of sectionDef.fields) sectionFieldKeys.add(fk);

        const sectionFields = fields.filter(
          (f) => sectionFieldKeys.has(f.key) || sectionFieldKeys.has(normalizeFieldKey(f.key))
        );

        const sectionBody = sectionFields
          .map((f) =>
            renderFieldBlockWithConfig(f, config.componentConfig, formPrimitives, innerIndent)
          )
          .filter(Boolean)
          .join('\n');

        const descLine = sectionDef.description
          ? `\n${innerIndent}<p>${sectionDef.description}</p>`
          : '';

        renderedParts.push(
          `${fieldIndent}<section>`,
          `${innerIndent}<h2>${sectionDef.title}</h2>${descLine}`,
          sectionBody,
          `${fieldIndent}</section>`
        );
      } else if (!sectionKey) {
        const rendered = renderFieldBlockWithConfig(
          field,
          config.componentConfig,
          formPrimitives,
          fieldIndent
        );
        if (rendered) renderedParts.push(rendered);
      }
      // Fields whose section is already emitted are skipped (rendered inside the section block)
    }

    body = renderedParts.filter(Boolean).join('\n');
  } else {
    body = fields
      .map((field) =>
        renderFieldBlockWithConfig(field, config.componentConfig, formPrimitives, '      ')
      )
      .filter(Boolean)
      .join('\n');
  }

  // useFieldArray hook declarations
  const arrayHooks = arrayFields
    .map((f) => {
      const varName = toVarName(f.key);
      return `  const { fields: ${varName}Fields, append: append${capitalize(varName)}, remove: remove${capitalize(varName)} } = useFieldArray<FormData, '${f.key}'>({ control, name: '${f.key}' });`;
    })
    .join('\n');

  // Build useForm destructure parts
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

  // Props interface
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

  // Render section components after the regular fields
  const sectionIndent = useFormProvider ? '        ' : '      ';
  const sectionBlock = renderSections(sections, sectionIndent);

  // Form body with optional FormProvider wrapping
  const formContent = [
    formOpen,
    body,
    ...(sectionBlock ? [sectionBlock] : []),
    ...formTail,
    `    </form>`
  ];

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
    `  const form = useForm<FormData>({`,
    `    resolver: zodResolver(${config.exportName}),`,
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

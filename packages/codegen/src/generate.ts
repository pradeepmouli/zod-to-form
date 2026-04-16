import type { CodegenConfig, FormField } from '@zod-to-form/core';
import { getEmptyDefault } from '@zod-to-form/core';
import type { ComponentOverride, FieldConfig, ZodFormsConfig } from '@zod-to-form/core';
import {
  getFileHeader,
  renderField,
  registerPathExpr,
  renderOptimizedRegister
} from './templates.js';
import { PRESET_TEMPLATE_IMPORTS } from './field-templates.js';

// `CodegenConfig` moved to @zod-to-form/core during feature 007-vite-codegen-plugin.
// Re-exported below for backward compatibility so existing consumers of
// `import { CodegenConfig } from '@zod-to-form/codegen'` keep working.
export type { CodegenConfig } from '@zod-to-form/core';

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
      if (!rendered && value !== undefined && value !== null) {
        console.warn(
          `[zod-to-form codegen] Prop "${key}" has unsupported type "${typeof value}" and will be omitted from generated code.`
        );
      }
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

function renderFieldContainer(
  field: FormField,
  content: string,
  indent: string,
  preset: 'shadcn' | 'html' = 'html'
): string {
  const labelContent = field.deprecated
    ? `<s>${field.label}</s> <span title="Deprecated">⚠</span>`
    : field.label;

  if (preset === 'shadcn') {
    const lines = [
      `${indent}<FormItem>`,
      `${indent}  <FormLabel htmlFor="${field.key}">${labelContent}</FormLabel>`,
      `${indent}  <FormControl>${content}</FormControl>`
    ];
    if (field.description) {
      lines.push(`${indent}  <FormDescription>${field.description}</FormDescription>`);
    }
    if (field.helpText) {
      lines.push(
        `${indent}  <p className="text-sm text-muted-foreground mt-1">${field.helpText}</p>`
      );
    }
    lines.push(`${indent}  <FormMessage />`);
    lines.push(`${indent}</FormItem>`);
    return lines.join('\n');
  }

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

/**
 * Resolve the component name and override config for a single `FormField` key.
 *
 * Walks the `componentConfig.fields` map (by exact key, then normalized key) to
 * find a per-field override, then falls back to the `componentConfig.components.overrides`
 * map keyed by component name. Returns `{ source: 'none' }` when no config is present.
 *
 * @param fieldKey - Dot-path key from `FormField.key` (e.g. `'address.street'`).
 * @param componentName - Inferred component name from the schema walker.
 * @param componentConfig - Optional `ZodFormsConfig` with `fields` and `components` overrides.
 * @returns Resolved component name, override config, and the resolution source.
 *
 * @useWhen
 * - Building a custom codegen backend that needs the same override resolution logic as the CLI
 * - Writing tests that verify field-to-component mapping for a given config
 *
 * @avoidWhen
 * - You are using the CLI or Vite plugin — this is called internally and you don't need it
 *
 * @pitfalls
 * - NEVER assume `source: 'none'` means the field has no component — the schema walker may
 *   have inferred one; `resolveFieldMapping` only resolves user-provided config overrides
 *
 * @category Codegen
 */
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
  indent: string,
  optimized = false
): string {
  const children = (field.children ?? [])
    .map((child) =>
      renderFieldBlockWithConfig(child, componentConfig, `${indent}  `, 'html', optimized)
    )
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
  indent: string,
  optimized = false
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
    itemJsx = renderFieldBlockWithConfig(
      indexedItemField,
      componentConfig,
      `${indent}      `,
      'html',
      optimized
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

function resolvePropMap(
  componentOverride?: ComponentOverride,
  override?: FieldConfig
): Record<string, string> | undefined {
  const entryMap = componentOverride?.props;
  const fieldMap = override?.props;
  function filterRhfProps(
    map: Record<string, unknown> | undefined
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
  indent = '      ',
  preset: 'shadcn' | 'html' = 'html',
  optimized = false
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
    const content = renderMappedComponent(
      field,
      mapping.componentName,
      mapping.componentOverride,
      mapping.override,
      overrideProps
    );
    return renderFieldContainer(field, content, indent, preset);
  }

  if (field.component === 'Fieldset') {
    return renderNestedBlock(field, componentConfig, indent, optimized);
  }

  if (field.component === 'ArrayField') {
    return renderArrayBlock(field, componentConfig, indent, optimized);
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
    return renderFieldContainer(field, content, indent, preset);
  }

  // When optimized and the field has a validation strategy, pass the optimized
  // register expression directly into renderField (avoids brittle string replace)
  if (optimized && field.validation) {
    const optimizedExpr = renderOptimizedRegister(field, field.key);
    return renderFieldContainer(field, renderField(field, optimizedExpr), indent, preset);
  }

  return renderFieldContainer(field, renderField(field), indent, preset);
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

function collectZodSchemaFields(fields: FormField[]): FormField[] {
  const result: FormField[] = [];
  for (const field of fields) {
    if (field.validation?.mode === 'zodSchema') {
      result.push(field);
    }
    if (field.children?.length) {
      result.push(...collectZodSchemaFields(field.children));
    }
    if (field.arrayItem) {
      result.push(...collectZodSchemaFields([field.arrayItem]));
    }
  }
  return result;
}

function hasAnyZodSchemaOrSchemaLite(
  fields: FormField[],
  schemaLite: import('zod/v4/core').$ZodType | null | undefined
): boolean {
  if (schemaLite) return true;
  return collectZodSchemaFields(fields).length > 0;
}

function generateHoistedValidators(fields: FormField[], exportName: string): string[] {
  // Emit a hoisted validator for each leaf field that needs zodSchema-mode validation.
  //
  // For top-level fields: ExportName.shape['field'].safeParse(value)
  // For nested object paths: ExportName.shape['a'].shape['b'].safeParse(value) — walks segments
  // For array element template paths (contain numeric segments like "items.0.name"):
  //   skipped, because `.shape[0]` isn't meaningful on an array.
  const zodFields = collectZodSchemaFields(fields).filter(
    (f) => !f.key.split('.').some((seg) => /^\d+$/.test(seg))
  );
  return zodFields.map((field) => {
    const safeKey = field.key.replace(/[^a-zA-Z0-9_]/g, '_');
    const segments = field.key.split('.');
    // Build the nested shape accessor by stepping through each segment.
    let accessor = exportName;
    for (const seg of segments) {
      accessor += `.shape[${JSON.stringify(seg)}]`;
    }
    return `const _validate_${safeKey} = (value: unknown) => { const r = ${accessor}.safeParse(value); return r.success ? true : r.error.issues[0]?.message ?? 'Invalid'; };`;
  });
}

/**
 * Generate a React form component as a TypeScript string from `FormField[]`.
 *
 * Produces a `.tsx` file string containing imports, the form component, and
 * (when `config.mode === 'auto-save'`) the `FormProvider` wrapper. The output
 * is deterministic for a given `(fields, config)` pair — same inputs always
 * produce the same output string.
 *
 * @param fields - Intermediate `FormField[]` from `walkSchema`.
 * @param config - Resolved codegen config (output path, component names, UI preset, etc.).
 * @returns The generated `.tsx` source as a string. Not yet written to disk.
 *
 * @example
 * ```ts
 * const fields = walkSchema(schema, { formRegistry });
 * const code = generateFormComponent(fields, {
 *   schemaPath: './signup.schema.ts',
 *   exportName: 'signupSchema',
 *   outputPath: './SignupForm.tsx',
 *   componentName: 'SignupForm',
 *   mode: 'submit',
 *   ui: 'shadcn',
 * });
 * await writeFile('./SignupForm.tsx', code, 'utf8');
 * ```
 *
 * @useWhen
 * - Building a custom codegen pipeline that assembles `FormField[]` and needs the TSX string
 * - Writing codegen tests that verify output structure without spawning a CLI process
 *
 * @avoidWhen
 * - You want file-writing behavior — use `runGenerate()` from `@zod-to-form/cli` instead
 * - You are using the Vite plugin — `compileTarget` wraps this and handles esbuild transformation
 *
 * @pitfalls
 * - NEVER call `generateFormComponent` with a stale `fields` array from a previous schema
 *   version — there is no cache invalidation; callers must re-run `walkSchema` on schema change
 * - NEVER use the returned string as a module cache key — it is not content-addressed;
 *   use `configHash` from `@zod-to-form/core` on the config object instead
 *
 * @category Codegen
 */
export function generateFormComponent(fields: FormField[], config: CodegenConfig): string {
  const schemaImportPath = config.schemaImportPath ?? './schema';
  const arrayFields = collectArrayFields(fields);
  const hasArrays = arrayFields.length > 0;
  const useFormProvider = config.formProvider || config.mode === 'auto-save';
  const hasControlled = hasControlledFields(fields, config.componentConfig);
  const optimized = config.validationLevel != null;

  const preset =
    config.componentConfig?.components?.preset ?? (config.ui === 'shadcn' ? 'shadcn' : 'html');

  const mappedComponents = collectMappedComponentNames(fields, config.componentConfig);
  const importNames = new Set<string>(mappedComponents);

  // Add form primitive imports required by the preset's field template
  const templateImports = PRESET_TEMPLATE_IMPORTS[preset] ?? [];
  for (const name of templateImports) {
    importNames.add(name);
  }

  const componentImportLine =
    config.componentConfig && importNames.size > 0
      ? `import { ${Array.from(importNames).sort().join(', ')} } from '${config.componentConfig.components.source}';`
      : undefined;

  // Determine optimized import flags
  const optimizedOptions = optimized
    ? {
        includeZodResolver: false, // Optimized mode never uses zodResolver
        includeZod: hasAnyZodSchemaOrSchemaLite(fields, config.schemaLite)
      }
    : undefined;

  const header = getFileHeader(
    schemaImportPath,
    config.exportName,
    hasArrays,
    config.mode,
    componentImportLine,
    { hasControlled, formProvider: useFormProvider, preset },
    optimizedOptions
  );

  // When optimized with schemaLite, the form imports from the .lite.ts file
  const hasSchemaLite = optimized && config.schemaLite != null;
  const schemaLiteImport = hasSchemaLite
    ? `import { schemaLite } from './${config.componentName}.lite.js';`
    : undefined;

  // Generate hoisted validators for optimized mode
  const hoistedValidators = optimized ? generateHoistedValidators(fields, config.exportName) : [];

  const body = fields
    .map((field) =>
      renderFieldBlockWithConfig(field, config.componentConfig, '      ', preset, optimized)
    )
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
    propsLines.push(`  onValueChange?: (data: FormOutput) => void;`);
    propsLines.push(`  onSubmit?: (data: FormOutput) => void;`);
  } else {
    propsLines.push(`  onSubmit: (data: FormOutput) => void;`);
  }
  propsLines.push(`  defaultValues?: Partial<FormData>;`);
  propsLines.push(`  values?: FormData;`);

  const autoSaveEffect =
    config.mode === 'auto-save'
      ? [
          `  useEffect(() => {`,
          `    const subscription = watch((values) => {`,
          `      props.onValueChange?.(values as unknown as FormOutput);`,
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
      : hasSchemaLite
        ? `    <form onSubmit={handleSubmit(onSubmitValidated)}>`
        : `    <form onSubmit={handleSubmit((data) => props.onSubmit(data as unknown as FormOutput))}>`;

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

  // Build useForm options based on optimization mode.
  //
  // Resolver hoisting: zodResolver(Schema) is expensive — it builds a resolver
  // closure from the schema. If called inside the function body it runs on
  // every render. We hoist it to module scope so it's created once per app
  // lifetime (schema is a module-level import and never changes).
  let useFormLines: string[];
  let hoistedResolverLines: string[] = [];
  if (optimized) {
    // Optimized mode never uses zodResolver — per-field validation handles fields,
    // and schemaLite (if present) handles top-level effects in the submit wrapper.
    useFormLines = [`  const form = useForm<FormData>({`];
  } else if (preset === 'shadcn') {
    // Shadcn preset skips the normalizeFormValues wrapper (shadcn components
    // already return plain values). Hoist the resolver directly.
    hoistedResolverLines = [`const _resolver = zodResolver(${config.exportName});`];
    useFormLines = [`  const form = useForm<FormData>({`, `    resolver: _resolver,`];
  } else {
    // HTML preset wraps the resolver with normalizeFormValues to coerce
    // FileList/Date-like inputs. Hoist both the base resolver and the wrapper.
    // Using `typeof _baseResolver` for the wrapper type so TS infers the
    // correct RHF Resolver signature without needing to import the type.
    hoistedResolverLines = [
      `const _baseResolver = zodResolver(${config.exportName});`,
      `const _resolver: typeof _baseResolver = (values, ctx, opts) => _baseResolver(normalizeFormValues(values) as FormData, ctx, opts);`
    ];
    useFormLines = [`  const form = useForm<FormData>({`, `    resolver: _resolver,`];
  }

  // Build submit wrapper using the imported schemaLite from the .lite.ts file.
  // The lite schema only validates top-level effects (superRefine/refine/transform),
  // not field-level constraints (those are handled per-field).
  const schemaLiteWrapper = hasSchemaLite
    ? [
        ``,
        `  const onSubmitValidated = (data: FormData) => {`,
        `    const result = schemaLite.safeParse(data);`,
        `    if (!result.success && result.error) {`,
        `      for (const issue of result.error.issues) {`,
        `        const field = issue.path?.[0];`,
        `        if (typeof field === 'string') {`,
        `          form.setError(field as keyof FormData & string, { type: 'validate', message: issue.message });`,
        `        } else {`,
        `          form.setError('root', { type: 'validate', message: issue.message });`,
        `        }`,
        `      }`,
        `      return;`,
        `    }`,
        `    props.onSubmit(data as unknown as FormOutput);`,
        `  };`
      ]
    : [];

  return [
    header,
    ...(schemaLiteImport ? [schemaLiteImport] : []),
    ...(hoistedValidators.length > 0 ? ['', ...hoistedValidators] : []),
    ...(hoistedResolverLines.length > 0 ? ['', ...hoistedResolverLines] : []),
    '',
    `export function ${config.componentName}(props: {`,
    ...propsLines,
    `}) {`,
    ...useFormLines,
    ...(config.mode === 'auto-save' ? [`    mode: 'onChange',`] : []),
    `    defaultValues: props.defaultValues,`,
    `    values: props.values,`,
    `  });`,
    `  const ${useFormDestructure} = form;`,
    ...(hasArrays ? [arrayHooks] : []),
    ...autoSaveEffect,
    ...schemaLiteWrapper,
    '',
    `  return (`,
    ...wrappedContent,
    `  );`,
    `}`,
    '',
    // Emit a default export alongside the named one so either import
    // style works: `import Form from './x'` and `import { Form } from
    // './x'`. The Vite plugin's `?z2f` virtual modules and the CLI's
    // `.generated.tsx` files both benefit — matches the convention
    // every React component-library generator uses.
    `export default ${config.componentName};`
  ].join('\n');
}

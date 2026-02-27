import path from 'node:path';
import type { FormField } from '@zod-to-form/core';
import { getFileHeader, renderField } from './templates.js';

export type CodegenConfig = {
  schemaPath: string;
  exportName: string;
  outputPath: string;
  componentName: string;
  ui: 'shadcn' | 'unstyled';
  serverAction: boolean;
};

function getSchemaImportPath(config: CodegenConfig): string {
  const relative = path
    .relative(path.dirname(config.outputPath), config.schemaPath)
    .replace(/\\/g, '/');

  if (relative.startsWith('.')) {
    return relative;
  }

  return `./${relative}`;
}

/** Convert a field key to a safe camelCase variable prefix (e.g. 'address.street' → 'addressStreet') */
function toVarName(key: string): string {
  return key.replace(/[^a-zA-Z0-9]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** Collect all array fields (recursively through nested objects) */
function collectArrayFields(fields: FormField[]): FormField[] {
  const result: FormField[] = [];
  for (const field of fields) {
    if (field.component === 'ArrayField') {
      result.push(field);
    }
    if (field.component === 'Fieldset' && field.children) {
      result.push(...collectArrayFields(field.children));
    }
  }
  return result;
}

function renderNestedBlock(field: FormField, indent: string): string {
  const children = (field.children ?? [])
    .map((child) => renderFieldBlock(child, `${indent}  `))
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

function renderArrayBlock(field: FormField, indent: string): string {
  const varName = toVarName(field.key);
  const itemField = field.arrayItem;
  const itemJsx = itemField
    ? renderField({ ...itemField, key: `\${${varName}Fields[index].id}` })
    : `<input {...register(\`${field.key}.\${index}\`)} />`;

  return [
    `${indent}<div>`,
    `${indent}  <label>${field.label}</label>`,
    `${indent}  {${varName}Fields.map((item, index) => (`,
    `${indent}    <div key={item.id}>`,
    `${indent}      ${itemJsx.replace(new RegExp(`register\\('${field.key}\\.0'\\)`), `register(\`${field.key}.\${index}\`)`)}`,
    `${indent}      <button type="button" onClick={() => remove${capitalize(varName)}(index)}>Remove</button>`,
    `${indent}    </div>`,
    `${indent}  ))}`,
    `${indent}  <button type="button" onClick={() => append${capitalize(varName)}('')}>Add</button>`,
    `${indent}</div>`
  ].join('\n');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderFieldBlock(field: FormField, indent = '      '): string {
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
    return renderNestedBlock(field, indent);
  }

  if (field.component === 'ArrayField') {
    return renderArrayBlock(field, indent);
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

  const header = getFileHeader(schemaImportPath, config.exportName, hasArrays);
  const body = fields.map((field) => renderFieldBlock(field)).join('\n');

  // useFieldArray hook declarations
  const arrayHooks = arrayFields
    .map((f) => {
      const varName = toVarName(f.key);
      return `  const { fields: ${varName}Fields, append: append${capitalize(varName)}, remove: remove${capitalize(varName)} } = useFieldArray({ control, name: '${f.key}' });`;
    })
    .join('\n');

  const useFormDestructure = hasArrays
    ? `{ register, handleSubmit, control }`
    : `{ register, handleSubmit }`;

  return [
    header,
    '',
    `export function ${config.componentName}(props: {`,
    `  onSubmit: (data: FormData) => void;`,
    `}) {`,
    `  const ${useFormDestructure} = useForm<FormData>({`,
    `    resolver: zodResolver(${config.exportName})`,
    `  });`,
    ...(hasArrays ? [arrayHooks] : []),
    '',
    `  return (`,
    `    <form onSubmit={handleSubmit(props.onSubmit)}>`,
    body,
    `      <button type="submit">Submit</button>`,
    `    </form>`,
    `  );`,
    `}`
  ].join('\n');
}

import type { FormField } from '@zod-to-form/core';
import type { ComponentMapType } from '../types/playground.ts';

function registerPathExpr(path: string): string {
  return path.includes('${') ? `register(\`${path}\`)` : `register('${path}')`;
}

function renderInput(field: FormField): string {
  const inputType = typeof field.props['type'] === 'string' ? field.props['type'] : 'text';
  return `<input id="${field.key}" type="${inputType}" {...${registerPathExpr(field.key)}} />`;
}

function renderCheckbox(field: FormField): string {
  return `<input id="${field.key}" type="checkbox" {...${registerPathExpr(field.key)}} />`;
}

function renderDatePicker(field: FormField): string {
  const registerExpr = field.key.includes('${')
    ? `register(\`${field.key}\`, { valueAsDate: true })`
    : `register('${field.key}', { valueAsDate: true })`;
  return `<input id="${field.key}" type="date" {...${registerExpr}} />`;
}

function renderFileInput(field: FormField): string {
  return `<input id="${field.key}" type="file" {...${registerPathExpr(field.key)}} />`;
}

function renderSelect(field: FormField): string {
  const options = (field.options ?? [])
    .map((option) => `<option value="${String(option.value)}">${option.label}</option>`)
    .join('');
  return `<select id="${field.key}" {...${registerPathExpr(field.key)}}>${options}</select>`;
}

function renderField(field: FormField): string {
  switch (field.component) {
    case 'Checkbox':
    case 'Switch':
      return renderCheckbox(field);
    case 'DatePicker':
      return renderDatePicker(field);
    case 'FileInput':
      return renderFileInput(field);
    case 'Select':
    case 'RadioGroup':
      return renderSelect(field);
    case 'Textarea':
      return `<textarea id="${field.key}" {...${registerPathExpr(field.key)}} />`;
    default:
      return renderInput(field);
  }
}

function renderFieldBlock(field: FormField, indent = '      '): string {
  if (field.component === 'Fieldset' && field.children?.length) {
    const children = field.children
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

  if (field.component === 'ArrayField') {
    return [
      `${indent}<div>`,
      `${indent}  <label>${field.label}</label>`,
      `${indent}  {/* Array field — use useFieldArray for dynamic items */}`,
      `${indent}</div>`
    ].join('\n');
  }

  const content = renderField(field);
  return [
    `${indent}<div>`,
    `${indent}  <label htmlFor="${field.key}">${field.label}</label>`,
    `${indent}  ${content}`,
    `${indent}</div>`
  ].join('\n');
}

function hasArrayField(fields: FormField[]): boolean {
  for (const f of fields) {
    if (f.component === 'ArrayField') return true;
    if (f.children?.length && hasArrayField(f.children)) return true;
  }
  return false;
}

export function generateFormCode(
  fields: FormField[],
  exportName = 'schema',
  componentName = 'GeneratedForm'
): string {
  const hasArrays = hasArrayField(fields);

  const rhfParts = ['useForm'];
  if (hasArrays) rhfParts.push('useFieldArray');

  const header = [
    `import { ${rhfParts.join(', ')} } from 'react-hook-form';`,
    `import { zodResolver } from '@hookform/resolvers/zod';`,
    `import { z } from 'zod';`,
    `import { ${exportName} } from './schema';`,
    ``,
    `type FormData = z.output<typeof ${exportName}>;`
  ].join('\n');

  const body = fields.map((field) => renderFieldBlock(field, '      ')).join('\n');

  return [
    header,
    ``,
    `export function ${componentName}(props: {`,
    `  onSubmit: (data: FormData) => void;`,
    `  defaultValues?: Partial<FormData>;`,
    `}) {`,
    `  const { register, handleSubmit } = useForm<FormData>({`,
    `    resolver: zodResolver(${exportName}),`,
    `    defaultValues: props.defaultValues,`,
    `  });`,
    ``,
    `  return (`,
    `    <form onSubmit={handleSubmit(props.onSubmit)}>`,
    body,
    `      <button type="submit">Submit</button>`,
    `    </form>`,
    `  );`,
    `}`
  ].join('\n');
}

export function generateZodFormCode(
  componentMap: ComponentMapType,
  customComponentNames: string[],
  exportName = 'schema',
  componentName = 'GeneratedForm'
): string {
  const useShadcn = componentMap === 'shadcn';
  const hasCustom = customComponentNames.length > 0;

  const imports: string[] = [
    `import { z } from 'zod';`,
    `import { ${exportName} } from './schema';`
  ];

  const zodFormImports: string[] = ['ZodForm'];
  if (useShadcn && !hasCustom) {
    zodFormImports.push('shadcnComponentMap');
  } else if (!useShadcn && !hasCustom) {
    zodFormImports.push('defaultComponentMap');
  } else {
    zodFormImports.push(useShadcn ? 'shadcnComponentMap' : 'defaultComponentMap');
  }
  imports.push(`import { ${zodFormImports.join(', ')} } from '@zod-to-form/react';`);

  if (hasCustom) {
    for (const name of customComponentNames) {
      imports.push(`import { ${name} } from './components/${name}';`);
    }
  }

  const lines: string[] = [
    ...imports,
    ``,
    `type FormData = z.output<typeof ${exportName}>;`,
    ``,
    `export function ${componentName}(props: {`,
    `  onSubmit: (data: FormData) => void;`,
    `}) {`
  ];

  const baseMap = useShadcn ? 'shadcnComponentMap' : 'defaultComponentMap';

  if (hasCustom) {
    const overrides = customComponentNames.map((n) => `    ${n},`).join('\n');
    lines.push(`  const components = {`);
    lines.push(`    ...${baseMap},`);
    lines.push(overrides);
    lines.push(`  };`);
    lines.push(``);
  }

  const componentsExpr = hasCustom ? 'components' : baseMap;

  lines.push(`  return (`);
  lines.push(`    <ZodForm`);
  lines.push(`      schema={${exportName}}`);
  lines.push(`      components={${componentsExpr}}`);
  lines.push(`      onSubmit={props.onSubmit}`);
  lines.push(`    >`);
  lines.push(`      <button type="submit">Submit</button>`);
  lines.push(`    </ZodForm>`);
  lines.push(`  );`);
  lines.push(`}`);

  return lines.join('\n');
}

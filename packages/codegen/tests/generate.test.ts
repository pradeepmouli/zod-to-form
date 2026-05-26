import { describe, it, expect } from 'vitest';
import type { FormField } from '@zod-to-form/core';
import {
  generateFormComponent,
  resolveFieldMapping,
  renderField,
  registerPathExpr
} from '../src/index.ts';

function makeField(overrides: Partial<FormField> & { key: string }): FormField {
  return {
    component: 'Input',
    props: {},
    label: overrides.key,
    required: false,
    readOnly: false,
    hidden: false,
    disabled: false,
    deprecated: false,
    constraints: {},
    zodType: 'string',
    ...overrides
  };
}

describe('registerPathExpr', () => {
  it('uses single quotes for static paths', () => {
    expect(registerPathExpr('name')).toBe("register('name')");
  });

  it('uses template literal for dynamic paths', () => {
    expect(registerPathExpr('items.${index}.name')).toBe('register(`items.${index}.name`)');
  });
});

describe('renderField', () => {
  it('renders Input with type from props', () => {
    const field = makeField({ key: 'email', props: { type: 'email' } });
    const result = renderField(field);
    expect(result).toContain('type="email"');
    expect(result).toContain("register('email')");
  });

  it('renders Checkbox', () => {
    const field = makeField({ key: 'agree', component: 'Checkbox' });
    const result = renderField(field);
    expect(result).toContain('type="checkbox"');
  });

  it('renders DatePicker with setValueAs → new Date() (not valueAsDate: true)', () => {
    const field = makeField({ key: 'dob', component: 'DatePicker' });
    const result = renderField(field);
    expect(result).toContain('type="date"');
    // Must emit setValueAs with new Date() — not the old valueAsDate: true flag
    expect(result).toContain('setValueAs:');
    expect(result).toContain('new Date(');
    expect(result).not.toContain('valueAsDate: true');
  });

  it('renders FileInput', () => {
    const field = makeField({ key: 'avatar', component: 'FileInput' });
    const result = renderField(field);
    expect(result).toContain('type="file"');
  });

  it('renders Select with options', () => {
    const field = makeField({
      key: 'color',
      component: 'Select',
      options: [
        { value: 'red', label: 'Red' },
        { value: 'blue', label: 'Blue' }
      ]
    });
    const result = renderField(field);
    expect(result).toContain('<select');
    expect(result).toContain('<option value="red">Red</option>');
    expect(result).toContain('<option value="blue">Blue</option>');
  });

  it('renders Textarea', () => {
    const field = makeField({ key: 'bio', component: 'Textarea' });
    const result = renderField(field);
    expect(result).toContain('<textarea');
  });

  it('renders Switch as checkbox', () => {
    const field = makeField({ key: 'notifications', component: 'Switch' });
    const result = renderField(field);
    expect(result).toContain('type="checkbox"');
  });
});

describe('resolveFieldMapping', () => {
  it('returns source:none when no componentConfig', () => {
    const result = resolveFieldMapping('name', 'Input', undefined);
    expect(result.source).toBe('none');
  });

  it('resolves field-level override', () => {
    const config = {
      components: { source: './components', overrides: {} },
      fields: { name: { component: 'CustomInput' } }
    };
    const result = resolveFieldMapping('name', 'Input', config);
    expect(result.source).toBe('fields');
    expect(result.componentName).toBe('CustomInput');
  });

  it('resolves component-level override', () => {
    const config = {
      components: {
        source: './components',
        overrides: { Input: { controlled: false } }
      }
    };
    const result = resolveFieldMapping('name', 'Input', config);
    expect(result.source).toBe('components');
    expect(result.componentName).toBe('Input');
  });

  it('returns source:none when no matching config', () => {
    const config = {
      components: { source: './components', overrides: {} },
      fields: {}
    };
    const result = resolveFieldMapping('name', undefined, config);
    expect(result.source).toBe('none');
  });

  it('treats non-builtin schema-driven component names as mapped components', () => {
    const config = {
      components: { source: './components', overrides: {} }
    };
    const result = resolveFieldMapping('expression', 'ExpressionEditor', config);
    expect(result.source).toBe('components');
    expect(result.componentName).toBe('ExpressionEditor');
  });
});

describe('generateFormComponent', () => {
  it('generates a valid form component with simple fields', () => {
    const fields = [
      makeField({ key: 'name', label: 'Name' }),
      makeField({ key: 'email', label: 'Email', props: { type: 'email' } })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'MyForm',
      mode: 'submit',
      ui: 'html'
    });

    expect(result).toContain('import { useForm');
    expect(result).toContain('import { zodResolver }');
    expect(result).toContain('export function MyForm');
    // Default export MUST also appear, so `import MyForm from './x'`
    // works alongside `import { MyForm } from './x'`. The Vite plugin's
    // `@zod-to-form/vite/client` ambient declarations type the default
    // export; the named export is the runtime alias.
    expect(result).toContain('export default MyForm;');
    // handleSubmit wraps onSubmit in an arrow that casts data to FormOutput
    // (RHF's TFieldValues is input-type; onSubmit receives output-type).
    expect(result).toContain('handleSubmit(');
    expect(result).toContain('props.onSubmit(data as unknown as FormOutput)');
    expect(result).toContain("register('name')");
    expect(result).toContain("register('email')");
    expect(result).toContain('<button type="submit">Submit</button>');
    // Zero-dep: no @zod-to-form/core or @zod-to-form/react imports
    expect(result).not.toContain('@zod-to-form/core');
    expect(result).not.toContain('@zod-to-form/react');
    // StripIndexSignature is inlined
    expect(result).toContain('type StripIndexSignature<T>');
    // normalizeFormValues is inlined for html preset
    expect(result).toContain('function normalizeFormValues');
  });

  it('passes dynamic fieldProps through to mapped components', () => {
    const fields = [
      makeField({
        key: 'typeCall.type',
        label: 'Wrapped Type',
        component: 'Select'
      })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'MappedForm',
      mode: 'submit',
      ui: 'html',
      componentConfig: {
        components: {
          source: './components',
          overrides: {
            TypeSelector: {
              controlled: true,
              props: {
                value: 'field.value',
                onChange: 'field.onChange'
              }
            }
          }
        },
        fields: {
          'typeCall.type': {
            component: 'TypeSelector'
          }
        }
      }
    });

    expect(result).toContain('fieldProps?: Record<string, Record<string, unknown>>;');
    expect(result).toContain('<TypeSelector');
    expect(result).toContain('{...(props.fieldProps?.["typeCall.type"] ?? {})}');
  });

  it('imports and renders schema-driven custom component names', () => {
    const fields = [
      makeField({
        key: 'expression',
        label: 'Expression',
        component: 'ExpressionEditor',
        zodType: 'object'
      })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'ExpressionForm',
      mode: 'submit',
      ui: 'html',
      componentConfig: {
        components: {
          source: './components',
          overrides: {}
        }
      }
    });

    expect(result).toContain("import { ExpressionEditor } from './components';");
    expect(result).toContain(
      '<ExpressionEditor id="expression" {...register(\'expression\')} {...(props.fieldProps?.["expression"] ?? {})} />'
    );
  });

  it('emits schema-derived native attrs (type) on uncontrolled mapped components', () => {
    const fields = [makeField({ key: 'email', label: 'Email', props: { type: 'email' } })];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'MappedNativeForm',
      mode: 'submit',
      ui: 'html',
      componentConfig: {
        components: {
          source: './components',
          overrides: {}
        },
        fields: {
          email: { component: 'Input' }
        }
      }
    });

    // type="email" must appear on the mapped <Input>, before the register spread
    expect(result).toContain('<Input id="email" type="email" {...register(\'email\')}');
  });

  it('emits type="number" on uncontrolled mapped components for numeric fields', () => {
    const fields = [
      makeField({ key: 'count', label: 'Count', props: { type: 'number' }, zodType: 'number' })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'MappedNumberForm',
      mode: 'submit',
      ui: 'html',
      componentConfig: {
        components: {
          source: './components',
          overrides: {}
        },
        fields: {
          count: { component: 'Input' }
        }
      }
    });

    expect(result).toContain('<Input id="count" type="number" {...register');
  });

  it('generates auto-save mode with watch and FormProvider', () => {
    const fields = [makeField({ key: 'name' })];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'AutoForm',
      mode: 'auto-save',
      ui: 'html'
    });

    expect(result).toContain('watch');
    expect(result).toContain('FormProvider');
    expect(result).toContain('useEffect');
    expect(result).toContain('onValueChange');
    expect(result).not.toContain('handleSubmit');
    expect(result).not.toContain('<button type="submit">');
  });

  it('handles array fields with useFieldArray', () => {
    const fields = [
      makeField({
        key: 'items',
        component: 'ArrayField',
        label: 'Items',
        arrayItem: makeField({ key: 'items.0', label: 'Item' })
      })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'ArrayForm',
      mode: 'submit',
      ui: 'html'
    });

    expect(result).toContain('useFieldArray');
    expect(result).toContain('itemsFields');
    expect(result).toContain('appendItems');
    expect(result).toContain('removeItems');
  });

  it('emits disabled Add button when maxLength constraint is set', () => {
    const fields = [
      makeField({
        key: 'tags',
        component: 'ArrayField',
        label: 'Tags',
        constraints: { maxLength: 5 },
        arrayItem: makeField({ key: 'tags.0', label: 'Tag' })
      })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'TagForm',
      mode: 'submit',
      ui: 'html'
    });

    expect(result).toContain('disabled={tagsFields.length >= 5}');
  });

  it('emits custom labels from arrayConfig in _arrayConfig prop', () => {
    const fields = [
      makeField({
        key: 'items',
        component: 'ArrayField',
        label: 'Items',
        props: { _arrayConfig: { addLabel: 'Add Row', removeLabel: 'Delete' } },
        arrayItem: makeField({ key: 'items.0', label: 'Item' })
      })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'ItemForm',
      mode: 'submit',
      ui: 'html'
    });

    expect(result).toContain('>Add Row<');
    expect(result).toContain('>Delete<');
  });

  it('emits disabled Remove button with minLength constraint', () => {
    const fields = [
      makeField({
        key: 'items',
        component: 'ArrayField',
        label: 'Items',
        constraints: { minLength: 1 },
        arrayItem: makeField({ key: 'items.0', label: 'Item' })
      })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'ItemForm',
      mode: 'submit',
      ui: 'html'
    });

    expect(result).toContain('disabled={itemsFields.length <= 1}');
  });

  it('uses default schemaImportPath when not provided', () => {
    const fields = [makeField({ key: 'name' })];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'Form',
      mode: 'submit',
      ui: 'html'
    });

    expect(result).toContain("from './schema'");
  });

  it('uses custom schemaImportPath when provided', () => {
    const fields = [makeField({ key: 'name' })];

    const result = generateFormComponent(fields, {
      schemaImportPath: './models/user.js',
      exportName: 'userSchema',
      componentName: 'UserForm',
      mode: 'submit',
      ui: 'html'
    });

    expect(result).toContain("from './models/user.js'");
    expect(result).toContain('userSchema');
  });

  it('mapped leaf emits required from resolveBaseProps (runtime parity #3 fix)', () => {
    // name is required (required: true) and mapped to a custom component
    // codegen previously omitted `required` — this test enforces the fix
    const fields = [
      makeField({
        key: 'name',
        label: 'Name',
        required: true,
        component: 'Input'
      })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'MyForm',
      mode: 'submit',
      ui: 'html',
      componentConfig: {
        components: { source: './components', overrides: {} },
        fields: {
          name: { component: 'CustomInput' }
        }
      }
    });

    // Must emit id and required — previously codegen only emitted id
    expect(result).toContain('<CustomInput');
    expect(result).toContain('id="name"');
    expect(result).toContain('required');
  });

  it('mapped leaf emits type from resolveNativeAttrs (email field)', () => {
    const fields = [
      makeField({
        key: 'email',
        label: 'Email',
        required: true,
        props: { type: 'email' }
      })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'MyForm',
      mode: 'submit',
      ui: 'html',
      componentConfig: {
        components: { source: './components', overrides: {} },
        fields: {
          email: { component: 'EmailInput' }
        }
      }
    });

    expect(result).toContain('<EmailInput');
    expect(result).toContain('id="email"');
    expect(result).toContain('required');
    expect(result).toContain('type="email"');
  });

  it('renders Fieldset with nested children', () => {
    const fields = [
      makeField({
        key: 'address',
        component: 'Fieldset',
        label: 'Address',
        children: [
          makeField({ key: 'address.street', label: 'Street' }),
          makeField({ key: 'address.city', label: 'City' })
        ]
      })
    ];

    const result = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'Form',
      mode: 'submit',
      ui: 'html'
    });

    expect(result).toContain('<fieldset>');
    expect(result).toContain('Address');
    expect(result).toContain("register('address.street')");
    expect(result).toContain("register('address.city')");
  });
});

import { describe, expect, it } from 'vitest';
import type { FormField } from '@zod-to-form/core';
import { generateFormComponent, resolveFieldMapping } from '../src/codegen.js';
import type { CodegenConfig } from '../src/codegen.js';
import type { ZodFormsConfig } from '../src/index.js';

describe('generateFormComponent', () => {
  it('generates valid TSX with form imports and field markup', async () => {
    const fields: FormField[] = [
      {
        key: 'name',
        component: 'Input',
        props: { type: 'text' },
        label: 'Name',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      },
      {
        key: 'role',
        component: 'Select',
        props: {},
        label: 'Role',
        required: true,
        readOnly: false,
        hidden: false,
        options: [
          { value: 'user', label: 'User' },
          { value: 'admin', label: 'Admin' }
        ],
        constraints: {},
        zodType: 'enum'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'userSchema',
      outputPath: '/tmp/UserForm.tsx',
      componentName: 'UserForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false
    });

    expect(output).toContain(`import { useForm } from 'react-hook-form';`);
    expect(output).toContain(`import { zodResolver } from '@hookform/resolvers/zod';`);
    expect(output).toContain(`import { userSchema } from './schema.js';`);
    expect(output).toContain('function UserForm');
    expect(output).toContain(`register('name')`);
    expect(output).toContain(`register('role')`);
    expect(output).toContain('Name');
    expect(output).toContain('Role');
    expect(output).toContain("import type { StripIndexSignature } from '@zod-to-form/core';");
    expect(output).not.toContain('@zod-to-form/react');
  });

  it('emits TODO comment when field has a custom render function', async () => {
    const fields: FormField[] = [
      {
        key: 'bio',
        component: 'Input',
        props: { type: 'text' },
        label: 'Bio',
        required: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string',
        hasCustomRender: true
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'profileSchema',
      outputPath: '/tmp/ProfileForm.tsx',
      componentName: 'ProfileForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false
    });

    expect(output).toContain('{/* TODO: custom renderer for bio — replace with your component */}');
    expect(output).not.toContain(`register('bio')`);
  });

  it('resolves field mapping with fields overriding fieldTypes', () => {
    const config: ZodFormsConfig = {
      components: '@app/components',
      fieldTypes: {
        string: { component: 'Input' },
        'cross-ref': { component: 'TypeSelector' }
      },
      fields: {
        'DataForm.superType': { fieldType: 'cross-ref', props: { refType: 'Data' } }
      }
    };

    const result = resolveFieldMapping('DataForm.superType', 'string', config);

    expect(result.source).toBe('fields');
    expect(result.entry?.component).toBe('TypeSelector');
    expect(result.override?.fieldType).toBe('cross-ref');
    expect(result.override?.props).toEqual({ refType: 'Data' });
  });

  it('uses fieldTypes mapping when no per-field override exists', () => {
    const config: ZodFormsConfig<{ Input: unknown }> = {
      components: '@app/components',
      fieldTypes: {
        string: { component: 'Input' }
      }
    };

    const result = resolveFieldMapping('UserForm.name', 'string', config);

    expect(result.source).toBe('fieldTypes');
    expect(result.entry?.component).toBe('Input');
    expect(result.override).toBeUndefined();
  });

  it('generates auto-save output with watch/useEffect and no submit button', async () => {
    const fields: FormField[] = [
      {
        key: 'name',
        component: 'Input',
        props: { type: 'text' },
        label: 'Name',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'userSchema',
      outputPath: '/tmp/UserForm.tsx',
      componentName: 'UserForm',
      mode: 'auto-save',
      ui: 'shadcn',
      serverAction: false
    });

    expect(output).toContain(`import { useEffect } from 'react';`);
    expect(output).toContain(`const form = useForm<FormData>({`);
    expect(output).toContain(`const { register, watch } = form;`);
    expect(output).toContain(`mode: 'onChange'`);
    expect(output).toContain(`const subscription = watch((values) => {`);
    expect(output).toContain(`props.onValueChange?.(values as FormData);`);
    expect(output).not.toContain(`type="submit"`);
    expect(output).not.toContain(`handleSubmit(props.onSubmit)`);
  });

  it('generates mapped component imports and per-field override props from component config', async () => {
    const fields: FormField[] = [
      {
        key: 'DataForm.superType',
        component: 'Input',
        props: { type: 'text' },
        label: 'Super Type',
        required: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'dataSchema',
      outputPath: '/tmp/DataForm.tsx',
      componentName: 'DataForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false,
      componentConfig: {
        components: '@app/components',
        fieldTypes: {
          string: { component: 'Input' },
          'cross-ref': { component: 'TypeSelector' }
        },
        fields: {
          'DataForm.superType': { fieldType: 'cross-ref', props: { refType: 'Data' } }
        }
      }
    });

    expect(output).toContain(`import { TypeSelector } from '@app/components';`);
    expect(output).toContain(
      `<TypeSelector id="DataForm.superType" {...register('DataForm.superType')} refType="Data" />`
    );
    expect(output).not.toContain(`<input id="DataForm.superType"`);
  });

  it('uses configured formPrimitives wrappers for generated fields', async () => {
    const fields: FormField[] = [
      {
        key: 'name',
        component: 'Input',
        props: { type: 'text' },
        label: 'Name',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'userSchema',
      outputPath: '/tmp/UserForm.tsx',
      componentName: 'UserForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false,
      componentConfig: {
        components: '@app/components',
        formPrimitives: {
          field: 'Field',
          label: 'FieldLabel',
          control: 'FieldControl'
        },
        fieldTypes: {
          string: { component: 'Input' }
        }
      }
    });

    expect(output).toContain(`import { Field, FieldControl, FieldLabel } from '@app/components';`);
    expect(output).toContain('<Field>');
    expect(output).toContain('<FieldLabel htmlFor="name">Name</FieldLabel>');
    expect(output).toContain('<FieldControl>');
    expect(output).toContain(`<input id="name" type="text" {...register('name')} />`);
  });

  it('normalizes schema import extension from .mts to .mjs', async () => {
    const fields: FormField[] = [
      {
        key: 'name',
        component: 'Input',
        props: { type: 'text' },
        label: 'Name',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.mts',
      exportName: 'userSchema',
      outputPath: '/tmp/UserForm.tsx',
      componentName: 'UserForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false
    });

    expect(output).toContain(`import { userSchema } from './schema.mjs';`);
  });

  it('emits stripped index-signature FormData type for loose object compatibility', async () => {
    const fields: FormField[] = [
      {
        key: 'name',
        component: 'Input',
        props: { type: 'text' },
        label: 'Name',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'userSchema',
      outputPath: '/tmp/UserForm.tsx',
      componentName: 'UserForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false
    });

    expect(output).toContain("import type { StripIndexSignature } from '@zod-to-form/core';");
    expect(output).toContain('type FormData = StripIndexSignature<z.output<typeof userSchema>>;');
  });

  it('generates object-array item paths with template-literal register calls and object append defaults', async () => {
    const fields: FormField[] = [
      {
        key: 'attributes',
        component: 'ArrayField',
        props: {},
        label: 'Attributes',
        required: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'array',
        arrayItem: {
          key: 'attributes.0',
          component: 'Fieldset',
          props: {},
          label: 'Attribute',
          required: true,
          readOnly: false,
          hidden: false,
          constraints: {},
          zodType: 'object',
          children: [
            {
              key: 'attributes.0.name',
              component: 'Input',
              props: { type: 'text' },
              label: 'Name',
              required: true,
              readOnly: false,
              hidden: false,
              constraints: {},
              zodType: 'string'
            },
            {
              key: 'attributes.0.optionalValue',
              component: 'Input',
              props: { type: 'text' },
              label: 'Optional Value',
              required: false,
              readOnly: false,
              hidden: false,
              constraints: {},
              zodType: 'string'
            }
          ]
        }
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'userSchema',
      outputPath: '/tmp/UserForm.tsx',
      componentName: 'UserForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false
    });

    expect(output).toContain(
      `useFieldArray<FormData, 'attributes'>({ control, name: 'attributes' })`
    );
    expect(output).toContain(`register(\`attributes.\${index}.name\`)`);
    expect(output).toContain(`register(\`attributes.\${index}.optionalValue\`)`);
    expect(output).toContain(`appendAttributes({ "name": '', "optionalValue": '' })`);
  });

  it('uses literal select option defaults in object-array append payloads', async () => {
    const fields: FormField[] = [
      {
        key: 'items',
        component: 'ArrayField',
        props: {},
        label: 'Items',
        required: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'array',
        arrayItem: {
          key: 'items.0',
          component: 'Fieldset',
          props: {},
          label: 'Item',
          required: true,
          readOnly: false,
          hidden: false,
          constraints: {},
          zodType: 'object',
          children: [
            {
              key: 'items.0.$type',
              component: 'Select',
              props: {},
              label: '$type',
              required: true,
              readOnly: true,
              hidden: false,
              constraints: {},
              zodType: 'literal',
              options: [{ value: 'Item', label: 'Item' }]
            }
          ]
        }
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'userSchema',
      outputPath: '/tmp/UserForm.tsx',
      componentName: 'UserForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false
    });

    expect(output).toContain(`appendItems({ "$type": "Item" })`);
  });

  it('emits nested-array fallback message instead of invalid dynamic hooks', async () => {
    const fields: FormField[] = [
      {
        key: 'items',
        component: 'ArrayField',
        props: {},
        label: 'Items',
        required: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'array',
        arrayItem: {
          key: 'items.0',
          component: 'Fieldset',
          props: {},
          label: 'Item',
          required: true,
          readOnly: false,
          hidden: false,
          constraints: {},
          zodType: 'object',
          children: [
            {
              key: 'items.0.tags',
              component: 'ArrayField',
              props: {},
              label: 'Tags',
              required: false,
              readOnly: false,
              hidden: false,
              constraints: {},
              zodType: 'array',
              arrayItem: {
                key: 'items.0.tags.0',
                component: 'Input',
                props: { type: 'text' },
                label: 'Tag',
                required: false,
                readOnly: false,
                hidden: false,
                constraints: {},
                zodType: 'string'
              }
            }
          ]
        }
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'userSchema',
      outputPath: '/tmp/UserForm.tsx',
      componentName: 'UserForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false
    });

    expect(output).toContain('Nested array editing is not auto-generated for dynamic paths.');
    expect(output).not.toContain('itemsIndexTagsFields');
  });

  it('resolveFieldMapping normalizes .0. array index to bracket notation for fields lookup', () => {
    const config: ZodFormsConfig = {
      components: '@app/components',
      fieldTypes: {
        string: { component: 'Input' },
        'cross-ref': { component: 'TypeSelector' }
      },
      fields: {
        'attributes[].typeCall.type': { fieldType: 'cross-ref' }
      }
    };

    // Concrete `.0.` key should match the bracket-notation config key
    const result = resolveFieldMapping('attributes.0.typeCall.type', 'string', config);

    expect(result.source).toBe('fields');
    expect(result.entry?.component).toBe('TypeSelector');
  });

  it('resolveFieldMapping normalizes ${index} template to bracket notation for fields lookup', () => {
    const config: ZodFormsConfig = {
      components: '@app/components',
      fieldTypes: {
        string: { component: 'Input' },
        'cross-ref': { component: 'TypeSelector' }
      },
      fields: {
        'items[].name': { fieldType: 'cross-ref' }
      }
    };

    const result = resolveFieldMapping('items.${index}.name', 'string', config);

    expect(result.source).toBe('fields');
    expect(result.entry?.component).toBe('TypeSelector');
  });

  it('resolveFieldMapping still matches exact field key before normalizing', () => {
    const config: ZodFormsConfig = {
      components: '@app/components',
      fieldTypes: {
        string: { component: 'Input' },
        'cross-ref': { component: 'TypeSelector' }
      },
      fields: {
        superType: { fieldType: 'cross-ref' }
      }
    };

    // Exact match — no normalization needed
    const result = resolveFieldMapping('superType', 'string', config);

    expect(result.source).toBe('fields');
    expect(result.entry?.component).toBe('TypeSelector');
  });

  it('renders custom component instead of expanding Fieldset children when fields override exists', async () => {
    const fields: FormField[] = [
      {
        key: 'superType',
        component: 'Fieldset',
        props: {},
        label: 'Super Type',
        required: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'object',
        children: [
          {
            key: 'superType.$refText',
            component: 'Input',
            props: { type: 'text' },
            label: '$Ref Text',
            required: true,
            readOnly: false,
            hidden: false,
            constraints: {},
            zodType: 'string'
          },
          {
            key: 'superType.ref',
            component: 'Input',
            props: { type: 'text' },
            label: 'Ref',
            required: true,
            readOnly: false,
            hidden: false,
            constraints: {},
            zodType: 'string'
          }
        ]
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'dataSchema',
      outputPath: '/tmp/DataForm.tsx',
      componentName: 'DataForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false,
      componentConfig: {
        components: '@app/components',
        fieldTypes: {
          string: { component: 'Input' },
          'cross-ref': { component: 'TypeSelector' }
        },
        fields: {
          superType: { fieldType: 'cross-ref' }
        }
      }
    });

    // Should render TypeSelector, not expand into sub-fields
    expect(output).toContain(`<TypeSelector id="superType" {...register('superType')}`);
    expect(output).not.toContain('superType.$refText');
    expect(output).not.toContain('superType.ref');
    expect(output).not.toContain('<fieldset>');
  });

  it('renders custom component for array-item nested fields using bracket-notation config keys', async () => {
    const fields: FormField[] = [
      {
        key: 'attributes',
        component: 'ArrayField',
        props: {},
        label: 'Attributes',
        required: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'array',
        arrayItem: {
          key: 'attributes.0',
          component: 'Fieldset',
          props: {},
          label: 'Attribute',
          required: true,
          readOnly: false,
          hidden: false,
          constraints: {},
          zodType: 'object',
          children: [
            {
              key: 'attributes.0.name',
              component: 'Input',
              props: { type: 'text' },
              label: 'Name',
              required: true,
              readOnly: false,
              hidden: false,
              constraints: {},
              zodType: 'string'
            },
            {
              key: 'attributes.0.typeCall',
              component: 'Fieldset',
              props: {},
              label: 'Type Call',
              required: true,
              readOnly: false,
              hidden: false,
              constraints: {},
              zodType: 'object',
              children: [
                {
                  key: 'attributes.0.typeCall.type',
                  component: 'Fieldset',
                  props: {},
                  label: 'Type',
                  required: true,
                  readOnly: false,
                  hidden: false,
                  constraints: {},
                  zodType: 'object',
                  children: [
                    {
                      key: 'attributes.0.typeCall.type.$refText',
                      component: 'Input',
                      props: { type: 'text' },
                      label: '$Ref Text',
                      required: true,
                      readOnly: false,
                      hidden: false,
                      constraints: {},
                      zodType: 'string'
                    }
                  ]
                }
              ]
            },
            {
              key: 'attributes.0.card',
              component: 'Fieldset',
              props: {},
              label: 'Card',
              required: true,
              readOnly: false,
              hidden: false,
              constraints: {},
              zodType: 'object',
              children: [
                {
                  key: 'attributes.0.card.inf',
                  component: 'Input',
                  props: { type: 'number' },
                  label: 'Inf',
                  required: true,
                  readOnly: false,
                  hidden: false,
                  constraints: {},
                  zodType: 'number'
                }
              ]
            }
          ]
        }
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'dataSchema',
      outputPath: '/tmp/DataForm.tsx',
      componentName: 'DataForm',
      mode: 'submit',
      ui: 'shadcn',
      serverAction: false,
      componentConfig: {
        components: '@app/components',
        fieldTypes: {
          string: { component: 'Input' },
          'cross-ref': { component: 'TypeSelector' },
          cardinality: { component: 'CardinalitySelector' }
        },
        fields: {
          'attributes[].typeCall.type': { fieldType: 'cross-ref' },
          'attributes[].card': { fieldType: 'cardinality' }
        }
      }
    });

    // typeCall.type should be TypeSelector, not expanded sub-fields
    expect(output).toContain('TypeSelector');
    expect(output).toMatch(/TypeSelector.*typeCall\.type/s);
    expect(output).not.toContain('typeCall.type.$refText');

    // card should be CardinalitySelector, not expanded sub-fields
    expect(output).toContain('CardinalitySelector');
    expect(output).not.toContain('card.inf');

    // name should still be a normal input
    expect(output).toContain(`register(\`attributes.\${index}.name\`)`);
  });

  it('generates Controller pattern for controlled components', async () => {
    const fields: FormField[] = [
      {
        key: 'kind',
        component: 'Select',
        props: {},
        label: 'Kind',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string',
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' }
        ]
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'testSchema',
      outputPath: '/tmp/TestForm.tsx',
      componentName: 'TestForm',
      mode: 'submit',
      ui: 'unstyled',
      serverAction: false,
      componentConfig: {
        components: '@app/components',
        fieldTypes: {
          Select: { component: 'MySelect', controlled: true }
        }
      }
    });

    expect(output).toContain('Controller');
    expect(output).toContain(`control={control}`);
    expect(output).toContain('field.value');
    expect(output).toContain('field.onChange');
    expect(output).not.toContain(`register('kind')`);
  });

  it('generates Controller with propMap remapping', async () => {
    const fields: FormField[] = [
      {
        key: 'type',
        component: 'Select',
        props: {},
        label: 'Type',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'testSchema',
      outputPath: '/tmp/TestForm.tsx',
      componentName: 'TestForm',
      mode: 'submit',
      ui: 'unstyled',
      serverAction: false,
      componentConfig: {
        components: '@app/components',
        fieldTypes: {
          Select: {
            component: 'TypeSelector',
            controlled: true,
            propMap: { onSelect: 'field.onChange', value: 'field.value' }
          }
        }
      }
    });

    expect(output).toContain('onSelect={field.onChange}');
    expect(output).toContain('value={field.value}');
    expect(output).not.toContain('onChange={field.onChange}');
  });

  it('generates FormProvider wrapping when formProvider option is set', async () => {
    const fields: FormField[] = [
      {
        key: 'name',
        component: 'Input',
        props: { type: 'text' },
        label: 'Name',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'testSchema',
      outputPath: '/tmp/TestForm.tsx',
      componentName: 'TestForm',
      mode: 'submit',
      ui: 'unstyled',
      serverAction: false,
      formProvider: true
    });

    expect(output).toContain('FormProvider');
    expect(output).toContain('<FormProvider {...form}>');
    expect(output).toContain('const form = useForm<FormData>');
  });

  it('generates defaultValues and values props on form component', async () => {
    const fields: FormField[] = [
      {
        key: 'name',
        component: 'Input',
        props: { type: 'text' },
        label: 'Name',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'testSchema',
      outputPath: '/tmp/TestForm.tsx',
      componentName: 'TestForm',
      mode: 'submit',
      ui: 'unstyled',
      serverAction: false
    });

    expect(output).toContain('defaultValues?: Partial<FormData>');
    expect(output).toContain('values?: FormData');
    expect(output).toContain('defaultValues: props.defaultValues');
    expect(output).toContain('values: props.values');
  });

  it('groups fields with section config into a section component', async () => {
    const fields: FormField[] = [
      {
        key: 'name',
        component: 'Input',
        props: { type: 'text' },
        label: 'Name',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      },
      {
        key: 'definition',
        component: 'Textarea',
        props: {},
        label: 'Definition',
        required: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      },
      {
        key: 'comments',
        component: 'Textarea',
        props: {},
        label: 'Comments',
        required: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      },
      {
        key: 'synonyms',
        component: 'ArrayField',
        props: {},
        label: 'Synonyms',
        required: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'array'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'testSchema',
      outputPath: '/tmp/TestForm.tsx',
      componentName: 'TestForm',
      mode: 'auto-save',
      ui: 'shadcn',
      serverAction: false,
      componentConfig: {
        components: '@/components/form-components',
        fieldTypes: {
          Input: { component: 'Input' },
          Textarea: { component: 'Textarea' }
        },
        fields: {
          definition: { section: 'MetadataSection' },
          comments: { section: 'MetadataSection' },
          synonyms: { section: 'MetadataSection' }
        }
      }
    });

    // All fields render individually (no section component wrapping)
    expect(output).toContain(`register('definition')`);
    expect(output).toContain(`register('comments')`);
    expect(output).toContain(`register('name')`);
  });

  it('groups nested fields with section config into a section component', async () => {
    const fields: FormField[] = [
      {
        key: 'address.city',
        component: 'Input',
        props: { type: 'text' },
        label: 'City',
        required: true,
        readOnly: false,
        hidden: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const config: CodegenConfig = {
      schemaPath: '/tmp/schema.ts',
      exportName: 'testSchema',
      outputPath: '/tmp/TestFormWithNestedSection.tsx',
      componentName: 'TestFormWithNestedSection',
      mode: 'submit',
      ui: 'unstyled',
      serverAction: false,
      // Nested field key participates in a section via componentConfig.fields
      componentConfig: {
        components: '@/components/form-components',
        fieldTypes: {
          Input: { component: 'Input' }
        },
        fields: {
          'address.city': { section: 'AddressSection' }
        }
      }
    };

    const output = await generateFormComponent(fields, config);

    // Field renders individually
    expect(output).toContain("register('address.city')");
  });
});

import { describe, expect, it } from 'vitest';
import type { FormField } from '@zod-to-form/core';
import { generateFormComponent, resolveFieldMapping } from '../src/codegen.js';
import type { ZodToFormComponentConfig } from '../src/index.js';

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
    expect(output).toContain('function UserForm');
    expect(output).toContain(`register('name')`);
    expect(output).toContain(`register('role')`);
    expect(output).toContain('Name');
    expect(output).toContain('Role');
    expect(output).not.toContain('@zod-to-form/core');
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
    const config: ZodToFormComponentConfig<{ Input: unknown; TypeSelector: unknown }> = {
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
    const config: ZodToFormComponentConfig<{ Input: unknown }> = {
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
    expect(output).toContain(`const { register, watch } = useForm<FormData>({`);
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
});

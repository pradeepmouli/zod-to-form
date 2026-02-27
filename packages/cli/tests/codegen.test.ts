import { describe, expect, it } from 'vitest';
import type { FormField } from '@zod-to-form/core';
import { generateFormComponent } from '../src/codegen.js';

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
      ui: 'shadcn',
      serverAction: false
    });

    expect(output).toContain('{/* TODO: custom renderer for bio — replace with your component */}');
    expect(output).not.toContain(`register('bio')`);
  });
});

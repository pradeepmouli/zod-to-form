import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { FormMeta } from '../src/types.js';
import { walkSchema } from '../src/walker.js';

describe('metadata resolution', () => {
  it('applies global metadata and form registry overrides with correct precedence', () => {
    const formRegistry = z.registry<{
      component?: string;
      order?: number;
      hidden?: boolean;
      disabled?: boolean;
      helpText?: string;
    }>();

    const bio = z
      .string()
      .meta({ title: 'Biography', examples: ['Tell us about yourself'] })
      .describe('Public profile text');
    const role = z.enum(['user', 'admin']).meta({ title: 'Account Role' });
    const secret = z.string();

    formRegistry.add(bio, { component: 'Textarea', order: 2, helpText: 'Markdown supported' });
    formRegistry.add(role, { order: 1 });
    formRegistry.add(secret, { hidden: true });

    const schema = z.object({ bio, role, secret });
    const fields = walkSchema(schema, { formRegistry });

    const bioField = fields.find((field) => field.key === 'bio');
    const roleField = fields.find((field) => field.key === 'role');
    const secretField = fields.find((field) => field.key === 'secret');

    expect(fields.map((field) => field.key)).toEqual(['role', 'bio', 'secret']);
    expect(bioField).toMatchObject({
      component: 'Textarea',
      label: 'Biography',
      placeholder: 'Tell us about yourself',
      description: 'Public profile text',
      order: 2,
      helpText: 'Markdown supported'
    });
    expect(roleField).toMatchObject({ label: 'Account Role', order: 1 });
    expect(secretField?.hidden).toBe(true);
  });

  it('applies formRegistry props to override processor defaults', () => {
    const formRegistry = z.registry<{
      props?: Record<string, unknown>;
    }>();

    const pw = z.string().min(1).meta({ title: 'Password' });
    formRegistry.add(pw, { props: { type: 'password' } });

    const schema = z.object({ password: pw });
    const fields = walkSchema(schema, { formRegistry });

    const field = fields.find((entry) => entry.key === 'password');
    expect(field?.props['type']).toBe('password');
    expect(field?.label).toBe('Password');
  });

  it('applies render function from form registry and sets hasCustomRender', () => {
    const formRegistry = z.registry<FormMeta>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test: registry generics don't perfectly unify with FormField's expanded shape
    const customRender = (() => 'custom-output') as any;
    const name = z.string();
    formRegistry.add(name, { render: customRender });

    const schema = z.object({ name });
    const fields = walkSchema(schema, { formRegistry });

    const field = fields.find((entry) => entry.key === 'name');
    expect(field?.hasCustomRender).toBe(true);
    expect(typeof field?.render).toBe('function');
    expect(field?.render?.(field, {})).toBe('custom-output');
  });

  it('prefers custom processor output over overlapping FormMeta component', () => {
    const formRegistry = z.registry<{
      component?: string;
    }>();

    const name = z.string();
    formRegistry.add(name, { component: 'Textarea' });

    const schema = z.object({ name });
    const fields = walkSchema(schema, {
      formRegistry,
      processors: {
        string: (_schema, _ctx, field) => {
          field.component = 'CustomInput';
          field.props['source'] = 'processor';
        }
      }
    });

    const field = fields.find((entry) => entry.key === 'name');
    expect(field?.component).toBe('CustomInput');
    expect(field?.props['source']).toBe('processor');
  });
});

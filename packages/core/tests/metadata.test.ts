import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '../src/walker.js';

describe('metadata resolution', () => {
  it('applies global metadata and form registry overrides with correct precedence', () => {
    const formRegistry = z.registry<{
      fieldType?: string;
      order?: number;
      hidden?: boolean;
      gridColumn?: string;
    }>();

    const bio = z
      .string()
      .meta({ title: 'Biography', examples: ['Tell us about yourself'] })
      .describe('Public profile text');
    const role = z.enum(['user', 'admin']).meta({ title: 'Account Role' });
    const secret = z.string();

    formRegistry.add(bio, { fieldType: 'textarea', order: 2, gridColumn: '1 / -1' });
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
      gridColumn: '1 / -1'
    });
    expect(roleField).toMatchObject({ label: 'Account Role', order: 1 });
    expect(secretField?.hidden).toBe(true);
  });
});

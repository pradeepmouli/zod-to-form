import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineConfig } from '../src/config.js';
import type { ZodFormsConfig, TypedFieldConfig } from '../src/config.js';

type Values = {
  user: {
    name: string;
  };
  tags: Array<{
    label: string;
  }>;
};

type Components = {
  Input: unknown;
  Textarea: unknown;
};

// ─── Existing type tests (backward compat) ───────────────────────────

describe('defineConfig typing', () => {
  it('accepts valid fieldTypes and fields', () => {
    const config = defineConfig<Components>({
      components: '@app/components',
      include: ['*Schema'],
      exclude: ['Internal*'],
      types: ['userSchema'],
      fieldTypes: {
        Input: { component: 'Input' },
        Textarea: { component: 'Textarea' }
      },
      fields: {
        'user.name': { fieldType: 'Input' },
        'tags[].label': { fieldType: 'Textarea' }
      }
    });

    expect(config.fields?.['user.name']?.fieldType).toBe('Input');
    expect(config.fields?.['tags[].label']?.fieldType).toBe('Textarea');
  });

  it('accepts string field keys (no path constraint enforcement)', () => {
    const config = defineConfig<Components>({
      components: '@app/components',
      fieldTypes: {
        Input: { component: 'Input' }
      },
      fields: {
        'user.unknown': { fieldType: 'Input' }
      }
    });

    expectTypeOf(1 as const).toEqualTypeOf<1>();
    expect(config).toBeDefined();
  });
});

// ─── New ZodFormsConfig generic tests (T015) ─────────────────────────

describe('ZodFormsConfig generics', () => {
  it('infers schemas keys from TSchemas generic', () => {
    type Schemas = {
      UserSchema: unknown;
      LoginSchema: unknown;
    };

    const config = defineConfig<Components, Schemas>({
      components: '@app/components',
      fieldTypes: {
        Input: { component: 'Input' }
      },
      schemas: {
        UserSchema: { name: 'UserForm' },
        LoginSchema: { name: 'LoginForm' }
      }
    });

    expect(config.schemas?.['UserSchema']?.name).toBe('UserForm');
  });

  it('defaults TSchemas to Record<string, unknown> allowing any keys', () => {
    const config = defineConfig({
      components: '@app/components',
      fieldTypes: {
        Input: { component: 'Input' as const }
      },
      schemas: {
        AnyName: { name: 'AnyForm' }
      }
    });

    expect(config.schemas?.['AnyName']?.name).toBe('AnyForm');
  });

  it('ZodFormsConfig accepts FieldConfig in fields', () => {
    const config: ZodFormsConfig = {
      components: '@app/components',
      fieldTypes: {},
      fields: {
        email: {
          fieldType: 'Input',
          order: 1,
          hidden: false,
          gridColumn: 'span 2',
          props: { placeholder: 'test' }
        }
      }
    };

    expectTypeOf(config.fields).toEqualTypeOf<Record<string, TypedFieldConfig> | undefined>();
  });
});

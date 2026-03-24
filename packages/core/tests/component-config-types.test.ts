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
  it('accepts valid components and fields', () => {
    const config = defineConfig<Components>({
      components: {
        source: '@app/components',
        overrides: {}
      },
      include: ['*Schema'],
      exclude: ['Internal*'],
      types: ['userSchema'],
      fields: {
        'user.name': { component: 'Input' },
        'tags[].label': { component: 'Textarea' }
      }
    });

    expect(config.fields?.['user.name']?.component).toBe('Input');
    expect(config.fields?.['tags[].label']?.component).toBe('Textarea');
  });

  it('accepts string field keys (no path constraint enforcement)', () => {
    const config = defineConfig<Components>({
      components: {
        source: '@app/components',
        overrides: {}
      },
      fields: {
        'user.unknown': { component: 'Input' }
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
      components: {
        source: '@app/components',
        overrides: {}
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
      components: {
        source: '@app/components',
        overrides: {}
      },
      schemas: {
        AnyName: { name: 'AnyForm' }
      }
    });

    expect(config.schemas?.['AnyName']?.name).toBe('AnyForm');
  });

  it('ZodFormsConfig accepts FieldConfig in fields', () => {
    const config: ZodFormsConfig = {
      components: {
        source: '@app/components',
        overrides: {}
      },
      fields: {
        email: {
          component: 'Input',
          order: 1,
          hidden: false,
          disabled: false,
          props: { placeholder: 'test', className: 'col-span-2' }
        }
      }
    };

    expectTypeOf(config.fields).toEqualTypeOf<Record<string, TypedFieldConfig> | undefined>();
  });
});

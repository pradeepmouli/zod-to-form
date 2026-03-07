import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineConfig, defineComponentConfig } from '../src/config.js';
import type { ZodFormsConfig, FieldOverride, TypedFieldConfig } from '../src/config.js';
import type { FieldConfig } from '../src/types.js';

type Values = {
  user: {
    name: string;
  };
  tags: Array<{
    label: string;
  }>;
};

type Components = {
  TextInput: unknown;
  TextareaInput: unknown;
};

// ─── Existing type tests (backward compat) ───────────────────────────

describe('defineComponentConfig typing (backward compat)', () => {
  it('accepts valid typed field paths', () => {
    const config = defineComponentConfig<Components, Values>({
      components: '@app/components',
      overwrite: true,
      include: ['*Schema'],
      exclude: ['Internal*'],
      types: ['userSchema'],
      fieldTypes: {
        Input: { component: 'TextInput' },
        Textarea: { component: 'TextareaInput' }
      },
      fields: {
        'user.name': { fieldType: 'Input' },
        'tags[].label': { fieldType: 'Textarea' }
      }
    });

    expectTypeOf(config.fields?.['user.name']?.fieldType).toEqualTypeOf<string | undefined>();
    expectTypeOf(config.fields?.['tags[].label']?.fieldType).toEqualTypeOf<string | undefined>();
  });

  it('rejects invalid typed field paths at compile time', () => {
    defineComponentConfig<Components, Values>({
      components: '@app/components',
      fieldTypes: {
        Input: { component: 'TextInput' }
      },
      fields: {
        // @ts-expect-error invalid field path for Values
        'user.unknown': { fieldType: 'Input' }
      }
    });

    expectTypeOf(1 as const).toEqualTypeOf<1>();
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
        Input: { component: 'TextInput' }
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

  it('FieldOverride is a deprecated alias for FieldConfig', () => {
    expectTypeOf<FieldOverride>().toEqualTypeOf<FieldConfig>();
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

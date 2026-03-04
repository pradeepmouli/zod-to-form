import { describe, expectTypeOf, it } from 'vitest';
import { defineComponentConfig } from '../src/component-config.js';

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

describe('defineComponentConfig typing', () => {
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

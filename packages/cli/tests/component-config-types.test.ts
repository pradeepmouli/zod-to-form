import { describe, expectTypeOf, it } from 'vitest';
import { defineComponentConfig } from '../src/index.js';

type Values = {
  profile: {
    bio: string;
  };
  tags: Array<{
    label: string;
  }>;
};

type Components = {
  Input: unknown;
  Textarea: unknown;
  Field: unknown;
  FieldLabel: unknown;
  FieldControl: unknown;
};

describe('CLI defineComponentConfig typing', () => {
  it('matches core typing for field paths and config controls', () => {
    const config = defineComponentConfig<Components, Values>({
      components: '@app/components',
      overwrite: true,
      include: ['*Schema'],
      exclude: ['Internal*'],
      types: ['profileSchema'],
      formPrimitives: {
        field: 'Field',
        label: 'FieldLabel',
        control: 'FieldControl'
      },
      fieldTypes: {
        Input: { component: 'Input' },
        Textarea: { component: 'Textarea' }
      },
      fields: {
        'profile.bio': { fieldType: 'Textarea' },
        'tags[].label': { fieldType: 'Input' }
      }
    });

    expectTypeOf(config.fields?.['profile.bio']?.fieldType).toEqualTypeOf<string | undefined>();
    expectTypeOf(config.formPrimitives?.control).toEqualTypeOf<keyof Components | undefined>();
  });

  it('rejects invalid field paths at compile time', () => {
    defineComponentConfig<Components, Values>({
      components: '@app/components',
      fieldTypes: {
        Input: { component: 'Input' }
      },
      fields: {
        // @ts-expect-error invalid field path for Values
        'profile.missing': { fieldType: 'Input' }
      }
    });

    expectTypeOf(1 as const).toEqualTypeOf<1>();
  });
});

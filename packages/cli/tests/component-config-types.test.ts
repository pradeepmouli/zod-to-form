import { describe, expect, it } from 'vitest';
import { defineConfig } from '../src/index.js';

type Components = {
  Input: unknown;
  Textarea: unknown;
  Field: unknown;
  FieldLabel: unknown;
  FieldControl: unknown;
};

describe('CLI defineConfig typing', () => {
  it('accepts valid fieldTypes, formPrimitives and fields', () => {
    const config = defineConfig<Components>({
      components: '@app/components',
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

    expect(config.fields?.['profile.bio']?.fieldType).toBe('Textarea');
    expect(config.formPrimitives?.control).toBe('FieldControl');
  });

  it('accepts any string field keys', () => {
    const config = defineConfig<Components>({
      components: '@app/components',
      fieldTypes: {
        Input: { component: 'Input' }
      },
      fields: {
        'profile.missing': { fieldType: 'Input' }
      }
    });

    expect(config).toBeDefined();
  });
});

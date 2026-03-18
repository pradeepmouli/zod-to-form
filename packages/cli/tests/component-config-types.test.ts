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
  it('accepts valid components overrides, formPrimitives and fields', () => {
    const config = defineConfig<Components>({
      components: {
        source: '@app/components',
        overrides: {
          Textarea: { controlled: false }
        }
      },
      include: ['*Schema'],
      exclude: ['Internal*'],
      types: ['profileSchema'],
      formPrimitives: {
        field: 'Field',
        label: 'FieldLabel',
        control: 'FieldControl'
      },
      fields: {
        'profile.bio': { component: 'Textarea' },
        'tags[].label': { component: 'Input' }
      }
    });

    expect(config.fields?.['profile.bio']?.component).toBe('Textarea');
    expect(config.formPrimitives?.control).toBe('FieldControl');
  });

  it('accepts any string field keys', () => {
    const config = defineConfig<Components>({
      components: {
        source: '@app/components'
      },
      fields: {
        'profile.missing': { component: 'Input' }
      }
    });

    expect(config).toBeDefined();
  });
});

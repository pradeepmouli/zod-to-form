import { describe, expect, it } from 'vitest';
import { defineComponentConfig, validateComponentConfig } from '../src/component-config.js';

describe('component config contracts', () => {
  it('defineComponentConfig returns input config unchanged', () => {
    const config = defineComponentConfig({
      components: '@app/components',
      fieldTypes: {
        Input: { component: 'TextInput' }
      },
      fields: {
        'user.name': { fieldType: 'Input', props: { placeholder: 'Name' } }
      }
    });

    expect(config.components).toBe('@app/components');
    expect(config.fieldTypes['Input']?.component).toBe('TextInput');
    expect(config.fields?.['user.name']?.fieldType).toBe('Input');
  });

  it('validateComponentConfig accepts valid component config object', () => {
    const parsed = validateComponentConfig({
      components: '@app/components',
      fieldTypes: {
        Input: { component: 'TextInput' }
      }
    });

    expect(parsed.components).toBe('@app/components');
    expect(parsed.fieldTypes['Input']?.component).toBe('TextInput');
  });

  it('validateComponentConfig rejects invalid fields shape', () => {
    expect(() =>
      validateComponentConfig({
        components: '@app/components',
        fieldTypes: {
          Input: { component: 'TextInput' }
        },
        fields: 'bad'
      })
    ).toThrow(/fields must be an object/);
  });
});

import { describe, it, expect } from 'vitest';
import type { FormField } from '@zod-to-form/core';
import { generateFormComponent } from '../src/index.ts';

function makeField(overrides: Partial<FormField> & { key: string }): FormField {
  return {
    component: 'Input',
    props: {},
    label: overrides.key,
    required: false,
    readOnly: false,
    hidden: false,
    disabled: false,
    deprecated: false,
    constraints: {},
    zodType: 'string',
    ...overrides
  };
}

describe('controlled boolean binding (Base UI shape)', () => {
  it('emits checked={!!field.value} onCheckedChange={field.onChange}, no === true', () => {
    const fields = [
      makeField({
        key: 'agree',
        label: 'Agree',
        component: 'Checkbox',
        zodType: 'boolean'
      })
    ];

    const out = generateFormComponent(fields, {
      exportName: 'schema',
      componentName: 'AgreeForm',
      mode: 'submit',
      ui: 'html',
      componentConfig: {
        components: {
          source: './components',
          overrides: {
            Checkbox: {
              controlled: true,
              props: {
                checked: '!!field.value',
                onCheckedChange: 'field.onChange'
              }
            }
          }
        }
      }
    });

    expect(out).toContain('checked={!!field.value}');
    expect(out).toContain('onCheckedChange={field.onChange}');
    expect(out).not.toContain('=== true');
  });
});

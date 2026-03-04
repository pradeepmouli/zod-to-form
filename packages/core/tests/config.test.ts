import { describe, expect, it } from 'vitest';
import {
  defineConfig,
  validateConfig,
  resolveFieldConfig,
  normalizeConfig,
  SHADCN_FIELD_TYPES,
  DEFAULT_FIELD_TYPES,
  defineComponentConfig,
  validateComponentConfig
} from '../src/config.js';
import type { ZodFormsConfig } from '../src/config.js';

// ─── Existing tests (backward compat) ────────────────────────────────

describe('component config contracts (backward compat)', () => {
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
      overwrite: true,
      types: ['userSchema'],
      include: ['*Schema'],
      exclude: ['Internal*'],
      formPrimitives: {
        field: 'Field',
        label: 'FieldLabel',
        control: 'FieldControl'
      },
      fieldTypes: {
        Input: { component: 'TextInput' }
      }
    });

    expect(parsed.components).toBe('@app/components');
    expect(parsed.fieldTypes['Input']?.component).toBe('TextInput');
  });

  it('validateComponentConfig rejects invalid include/exclude/types shape', () => {
    expect(() =>
      validateComponentConfig({
        components: '@app/components',
        fieldTypes: {
          Input: { component: 'TextInput' }
        },
        include: [123]
      })
    ).toThrow(/include must be an array of strings/);
  });

  it('validateComponentConfig rejects invalid formPrimitives shape', () => {
    expect(() =>
      validateComponentConfig({
        components: '@app/components',
        fieldTypes: {
          Input: { component: 'TextInput' }
        },
        formPrimitives: {
          label: ''
        }
      })
    ).toThrow(/formPrimitives\.label must be a non-empty string/);
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

// ─── New defineConfig tests (T008) ───────────────────────────────────

describe('defineConfig', () => {
  it('returns identity — config in equals config out', () => {
    const input = {
      components: '@/components/ui',
      fieldTypes: {
        Input: { component: 'Input' as const }
      }
    };

    const result = defineConfig(input);
    expect(result).toBe(input);
  });

  it('returns config with defaults and schemas sections', () => {
    const config = defineConfig({
      components: '@/components/ui',
      fieldTypes: {
        Input: { component: 'Input' as const }
      },
      defaults: {
        mode: 'submit',
        ui: 'shadcn',
        overwrite: false,
        serverAction: false
      },
      schemas: {
        UserSchema: {
          name: 'UserForm',
          mode: 'auto-save',
          fields: {
            email: { fieldType: 'Input', order: 1 }
          }
        }
      }
    });

    expect(config.defaults?.mode).toBe('submit');
    expect(config.schemas?.['UserSchema']?.name).toBe('UserForm');
    expect(config.schemas?.['UserSchema']?.fields?.['email']?.order).toBe(1);
  });
});

// ─── New validateConfig tests (T009) ─────────────────────────────────

describe('validateConfig', () => {
  it('accepts new shape with defaults and schemas', () => {
    const result = validateConfig({
      components: '@/components/ui',
      fieldTypes: {
        Input: { component: 'Input' }
      },
      defaults: {
        mode: 'submit',
        ui: 'shadcn',
        overwrite: true,
        serverAction: false
      },
      schemas: {
        UserSchema: {
          name: 'UserForm',
          mode: 'auto-save',
          out: './forms',
          serverAction: true,
          fields: {
            email: { fieldType: 'Input', order: 1, hidden: false }
          }
        }
      }
    });

    expect(result.components).toBe('@/components/ui');
    expect(result.defaults?.mode).toBe('submit');
    expect(result.schemas?.['UserSchema']?.name).toBe('UserForm');
  });

  it('accepts old shape without defaults/schemas (backward compat) (T010)', () => {
    const result = validateConfig({
      components: '@app/components',
      overwrite: true,
      types: ['userSchema'],
      include: ['*Schema'],
      exclude: ['Internal*'],
      fieldTypes: {
        Input: { component: 'TextInput' }
      },
      fields: {
        'user.name': { fieldType: 'Input', props: { placeholder: 'Name' } }
      }
    });

    expect(result.components).toBe('@app/components');
    expect(result.fieldTypes['Input']?.component).toBe('TextInput');
  });

  it('deprecated aliases still work (T011)', () => {
    const config = defineComponentConfig({
      components: '@app/components',
      fieldTypes: { Input: { component: 'Input' } }
    });
    expect(config.components).toBe('@app/components');

    const validated = validateComponentConfig({
      components: '@app/components',
      fieldTypes: { Input: { component: 'Input' } }
    });
    expect(validated.components).toBe('@app/components');
  });
});

// ─── FieldConfig alignment tests (T012) ──────────────────────────────

describe('FieldConfig alignment', () => {
  it('FieldConfig fields match FormMeta fields minus render', () => {
    const config = defineConfig({
      components: '@/ui',
      fieldTypes: { Input: { component: 'Input' as const } },
      fields: {
        email: {
          fieldType: 'Input',
          order: 1,
          hidden: false,
          gridColumn: 'span 2',
          props: { placeholder: 'email@example.com' }
        }
      }
    });

    const fieldConfig = config.fields?.['email'];
    expect(fieldConfig).toBeDefined();
    expect(fieldConfig?.fieldType).toBe('Input');
    expect(fieldConfig?.order).toBe(1);
    expect(fieldConfig?.hidden).toBe(false);
    expect(fieldConfig?.gridColumn).toBe('span 2');
    expect(fieldConfig?.props?.['placeholder']).toBe('email@example.com');
    // FieldConfig should NOT have 'render'
    expect('render' in (fieldConfig ?? {})).toBe(false);
  });
});

// ─── resolveFieldConfig tests (T013) ─────────────────────────────────

describe('resolveFieldConfig', () => {
  it('merges schema fields over global fields at property level', () => {
    const globalFields = {
      email: { fieldType: 'Input', order: 1, props: { placeholder: 'Email' } },
      name: { fieldType: 'Input', order: 2 }
    };

    const schemaFields = {
      email: { order: 5, props: { placeholder: 'Override' } }
    };

    const result = resolveFieldConfig(globalFields, schemaFields);

    // email: schema fields merge over global (property level, not object replace)
    expect(result['email']?.fieldType).toBe('Input'); // kept from global
    expect(result['email']?.order).toBe(5); // overridden by schema
    expect(result['email']?.props?.['placeholder']).toBe('Override'); // overridden by schema

    // name: unchanged from global
    expect(result['name']?.fieldType).toBe('Input');
    expect(result['name']?.order).toBe(2);
  });

  it('returns empty record when both inputs are undefined', () => {
    expect(resolveFieldConfig(undefined, undefined)).toEqual({});
  });

  it('returns schema fields when global is undefined', () => {
    const schemaFields = { email: { fieldType: 'Input' } };
    const result = resolveFieldConfig(undefined, schemaFields);
    expect(result['email']?.fieldType).toBe('Input');
  });

  it('returns global fields when schema is undefined', () => {
    const globalFields = { email: { fieldType: 'Input' } };
    const result = resolveFieldConfig(globalFields, undefined);
    expect(result['email']?.fieldType).toBe('Input');
  });

  it('adds schema-only fields to result', () => {
    const globalFields = { email: { fieldType: 'Input' } };
    const schemaFields = { password: { fieldType: 'Input', props: { type: 'password' } } };
    const result = resolveFieldConfig(globalFields, schemaFields);
    expect(result['email']?.fieldType).toBe('Input');
    expect(result['password']?.fieldType).toBe('Input');
  });
});

// ─── normalizeConfig tests (T014) ────────────────────────────────────

describe('normalizeConfig', () => {
  it('migrates top-level overwrite to defaults.overwrite', () => {
    const config = validateConfig({
      components: '@/ui',
      overwrite: true,
      fieldTypes: { Input: { component: 'Input' } }
    });

    const normalized = normalizeConfig(config);
    expect(normalized.defaults?.overwrite).toBe(true);
    expect((normalized as Record<string, unknown>)['overwrite']).toBeUndefined();
  });

  it('does not override existing defaults.overwrite', () => {
    const config = {
      components: '@/ui',
      overwrite: true,
      fieldTypes: { Input: { component: 'Input' } },
      defaults: { overwrite: false }
    } as ZodFormsConfig & { overwrite?: boolean };

    const normalized = normalizeConfig(config);
    expect(normalized.defaults?.overwrite).toBe(false);
  });

  it('returns config unchanged when no top-level overwrite', () => {
    const config = validateConfig({
      components: '@/ui',
      fieldTypes: { Input: { component: 'Input' } }
    });

    const normalized = normalizeConfig(config);
    expect(normalized).toBe(config);
  });
});

// ─── defineConfig preset behavior ─────────────────────────────────────

describe('defineConfig preset', () => {
  it('merges shadcn preset into fieldTypes when preset is shadcn', () => {
    const config = defineConfig({
      components: '@/ui',
      preset: 'shadcn',
      fieldTypes: {
        RichText: { component: 'RichText' }
      }
    });

    // User's entry preserved
    expect(config.fieldTypes['RichText']).toEqual({ component: 'RichText' });
    // Shadcn defaults merged in
    expect(config.fieldTypes['Input']).toEqual({ component: 'Input' });
    expect(config.fieldTypes['Switch']).toEqual({ component: 'Switch' });
    expect(config.fieldTypes['DatePicker']).toEqual({ component: 'DatePicker' });
  });

  it('merges unstyled preset into fieldTypes when preset is unstyled', () => {
    const config = defineConfig({
      components: '@/ui',
      preset: 'unstyled',
      fieldTypes: {
        CustomSelect: { component: 'CustomSelect' }
      }
    });

    expect(config.fieldTypes['CustomSelect']).toEqual({ component: 'CustomSelect' });
    expect(config.fieldTypes['Input']).toEqual({ component: 'Input' });
    expect(config.fieldTypes['Checkbox']).toEqual({ component: 'Checkbox' });
    // Shadcn-only entries should NOT be present
    expect(config.fieldTypes['Switch']).toBeUndefined();
    expect(config.fieldTypes['DatePicker']).toBeUndefined();
  });

  it('user fieldTypes override preset entries', () => {
    const config = defineConfig({
      components: '@/ui',
      preset: 'shadcn',
      fieldTypes: {
        Input: { component: 'MyCustomInput' }
      }
    });

    expect(config.fieldTypes['Input']).toEqual({ component: 'MyCustomInput' });
  });

  it('returns config unchanged when no preset is set', () => {
    const config = defineConfig({
      components: '@/ui',
      fieldTypes: {
        Input: { component: 'Input' }
      }
    });

    expect(config.fieldTypes).toEqual({ Input: { component: 'Input' } });
  });
});

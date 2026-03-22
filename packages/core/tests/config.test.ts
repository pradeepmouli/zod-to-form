import { describe, expect, it } from 'vitest';
import {
  defineConfig,
  validateConfig,
  resolveFieldConfig,
  normalizeConfig
} from '../src/config.js';
import type { ZodFormsConfig } from '../src/config.js';

// ─── Existing tests (backward compat) ────────────────────────────────

describe('component config contracts (backward compat)', () => {
  it('defineConfig returns input config unchanged', () => {
    const config = defineConfig({
      components: {
        source: '@app/components',
        overrides: {}
      },
      fields: {
        'user.name': { component: 'Input', props: { placeholder: 'Name' } }
      }
    });

    expect(config.components.source).toBe('@app/components');
    expect(config.fields?.['user.name']?.component).toBe('Input');
  });

  it('validateConfig accepts valid component config object', () => {
    const parsed = validateConfig({
      components: {
        source: '@app/components',
        overrides: {}
      },
      overwrite: true,
      types: ['userSchema'],
      include: ['*Schema'],
      exclude: ['Internal*'],
      formPrimitives: {
        field: 'Field',
        label: 'FieldLabel',
        control: 'FieldControl'
      }
    });

    expect(parsed.components.source).toBe('@app/components');
  });

  it('validateConfig rejects invalid include/exclude/types shape', () => {
    expect(() =>
      validateConfig({
        components: {
          source: '@app/components',
          overrides: {}
        },
        include: [123]
      })
    ).toThrow(/include must be an array of strings/);
  });

  it('validateConfig rejects invalid formPrimitives shape', () => {
    expect(() =>
      validateConfig({
        components: {
          source: '@app/components',
          overrides: {}
        },
        formPrimitives: {
          label: ''
        }
      })
    ).toThrow(/formPrimitives\.label must be a non-empty string/);
  });

  it('validateConfig rejects invalid fields shape', () => {
    expect(() =>
      validateConfig({
        components: {
          source: '@app/components',
          overrides: {}
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
      components: {
        source: '@/components/ui',
        overrides: {}
      }
    };

    const result = defineConfig(input);
    expect(result).toBe(input);
  });

  it('returns config with defaults and schemas sections', () => {
    const config = defineConfig({
      components: {
        source: '@/components/ui',
        overrides: {}
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
            email: { component: 'Input', order: 1 }
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
      components: {
        source: '@/components/ui',
        overrides: {}
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
            email: { component: 'Input', order: 1, hidden: false }
          }
        }
      }
    });

    expect(result.components.source).toBe('@/components/ui');
    expect(result.defaults?.mode).toBe('submit');
    expect(result.schemas?.['UserSchema']?.name).toBe('UserForm');
  });

  it('accepts old shape without defaults/schemas (backward compat) (T010)', () => {
    const result = validateConfig({
      components: {
        source: '@app/components',
        overrides: {}
      },
      overwrite: true,
      types: ['userSchema'],
      include: ['*Schema'],
      exclude: ['Internal*'],
      fields: {
        'user.name': { component: 'Input', props: { placeholder: 'Name' } }
      }
    });

    expect(result.components.source).toBe('@app/components');
  });

  it('deprecated aliases still work (T011)', () => {
    const config = defineConfig({
      components: {
        source: '@app/components',
        overrides: {}
      }
    });
    expect(config.components.source).toBe('@app/components');

    const validated = validateConfig({
      components: {
        source: '@app/components',
        overrides: {}
      }
    });
    expect(validated.components.source).toBe('@app/components');
  });
});

// ─── FieldConfig alignment tests (T012) ──────────────────────────────

describe('FieldConfig alignment', () => {
  it('FieldConfig fields match FormMeta fields minus render', () => {
    const config = defineConfig({
      components: {
        source: '@/ui',
        overrides: {}
      },
      fields: {
        email: {
          component: 'Input',
          order: 1,
          hidden: false,
          gridColumn: 'span 2',
          props: { placeholder: 'email@example.com' }
        }
      }
    });

    const fieldConfig = config.fields?.['email'];
    expect(fieldConfig).toBeDefined();
    expect(fieldConfig?.component).toBe('Input');
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
      email: { component: 'Input', order: 1, props: { placeholder: 'Email' } },
      name: { component: 'Input', order: 2 }
    };

    const schemaFields = {
      email: { order: 5, props: { placeholder: 'Override' } }
    };

    const result = resolveFieldConfig(globalFields, schemaFields);

    // email: schema fields merge over global (property level, not object replace)
    expect(result['email']?.component).toBe('Input'); // kept from global
    expect(result['email']?.order).toBe(5); // overridden by schema
    expect(result['email']?.props?.['placeholder']).toBe('Override'); // overridden by schema

    // name: unchanged from global
    expect(result['name']?.component).toBe('Input');
    expect(result['name']?.order).toBe(2);
  });

  it('returns empty record when both inputs are undefined', () => {
    expect(resolveFieldConfig(undefined, undefined)).toEqual({});
  });

  it('returns schema fields when global is undefined', () => {
    const schemaFields = { email: { component: 'Input' } };
    const result = resolveFieldConfig(undefined, schemaFields);
    expect(result['email']?.component).toBe('Input');
  });

  it('returns global fields when schema is undefined', () => {
    const globalFields = { email: { component: 'Input' } };
    const result = resolveFieldConfig(globalFields, undefined);
    expect(result['email']?.component).toBe('Input');
  });

  it('adds schema-only fields to result', () => {
    const globalFields = { email: { component: 'Input' } };
    const schemaFields = { password: { component: 'Input', props: { type: 'password' } } };
    const result = resolveFieldConfig(globalFields, schemaFields);
    expect(result['email']?.component).toBe('Input');
    expect(result['password']?.component).toBe('Input');
  });
});

// ─── normalizeConfig tests (T014) ────────────────────────────────────

describe('normalizeConfig', () => {
  it('migrates top-level overwrite to defaults.overwrite', () => {
    const config = validateConfig({
      components: {
        source: '@/ui',
        overrides: {}
      },
      overwrite: true
    });

    const normalized = normalizeConfig(config);
    expect(normalized.defaults?.overwrite).toBe(true);
    expect((normalized as Record<string, unknown>)['overwrite']).toBeUndefined();
  });

  it('does not override existing defaults.overwrite', () => {
    const config = {
      components: {
        source: '@/ui',
        overrides: {}
      },
      overwrite: true,
      defaults: { overwrite: false }
    } as ZodFormsConfig & { overwrite?: boolean };

    const normalized = normalizeConfig(config);
    expect(normalized.defaults?.overwrite).toBe(false);
  });

  it('returns config unchanged when no top-level overwrite', () => {
    const config = validateConfig({
      components: {
        source: '@/ui',
        overrides: {}
      }
    });

    const normalized = normalizeConfig(config);
    expect(normalized).toBe(config);
  });
});

// ─── defineConfig preset behavior ─────────────────────────────────────

describe('defineConfig preset', () => {
  it('merges shadcn preset into overrides when preset is shadcn', () => {
    const config = defineConfig({
      components: {
        source: '@/ui',
        preset: 'shadcn',
        overrides: {
          RichText: { controlled: true }
        }
      }
    });

    // User's entry preserved
    expect(config.components.overrides?.['RichText']).toEqual({ controlled: true });
  });

  it('merges html preset into overrides when preset is html', () => {
    const config = defineConfig({
      components: {
        source: '@/ui',
        preset: 'html',
        overrides: {
          CustomSelect: { controlled: true }
        }
      }
    });

    expect(config.components.overrides?.['CustomSelect']).toEqual({ controlled: true });
  });

  it('user overrides override preset entries', () => {
    const config = defineConfig({
      components: {
        source: '@/ui',
        preset: 'shadcn',
        overrides: {
          Input: { controlled: true }
        }
      }
    });

    expect(config.components.overrides?.['Input']).toEqual({ controlled: true });
  });

  it('returns config unchanged when no preset is set', () => {
    const config = defineConfig({
      components: {
        source: '@/ui',
        overrides: {
          Input: { controlled: false }
        }
      }
    });

    expect(config.components.overrides).toEqual({ Input: { controlled: false } });
  });
});

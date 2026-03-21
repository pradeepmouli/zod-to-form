import { describe, it, expect } from 'vitest';
import type { FormField } from '@zod-to-form/core';
import {
  generateConfigSchema,
  filterOrphanedOverrides,
  configToFormValues,
  formValuesToConfig,
  serializeConfigToTs,
  parseConfigFromTs
} from '../../src/lib/config-schema.ts';

function makeField(key: string, component = 'Input'): FormField {
  return {
    key,
    component,
    props: {},
    label: key,
    required: false,
    readOnly: false,
    hidden: false,
    constraints: {},
    zodType: 'string'
  };
}

describe('generateConfigSchema', () => {
  it('generates a schema with components, defaults, and fields sections', () => {
    const fields = [makeField('name'), makeField('age')];
    const schema = generateConfigSchema(fields);

    const valid = schema.safeParse({
      components: { source: './components/ui', preset: 'shadcn' },
      defaults: { mode: 'submit', ui: 'html' },
      fields: { name: { label: 'Full Name' }, age: undefined }
    });
    expect(valid.success).toBe(true);
  });

  it('accepts empty object', () => {
    const schema = generateConfigSchema([makeField('x')]);
    const valid = schema.safeParse({});
    expect(valid.success).toBe(true);
  });

  it('returns valid schema for null fields', () => {
    const schema = generateConfigSchema(null);
    const valid = schema.safeParse({ defaults: { ui: 'shadcn' } });
    expect(valid.success).toBe(true);
  });

  it('returns valid schema for empty fields array', () => {
    const schema = generateConfigSchema([]);
    const valid = schema.safeParse({});
    expect(valid.success).toBe(true);
  });
});

describe('filterOrphanedOverrides', () => {
  it('drops overrides for fields no longer in schema', () => {
    const config = {
      fields: {
        name: { component: 'Textarea' },
        removed: { component: 'Select' }
      }
    };
    const fields = [makeField('name')];

    const result = filterOrphanedOverrides(config, fields);
    expect(result?.fields).toHaveProperty('name');
    expect(result?.fields).not.toHaveProperty('removed');
  });

  it('returns null config as-is', () => {
    expect(filterOrphanedOverrides(null, [makeField('name')])).toBeNull();
  });

  it('handles config with no fields property', () => {
    const config = { components: { Input: {} } };
    const result = filterOrphanedOverrides(config, [makeField('name')]);
    expect(result).toEqual(config);
  });
});

describe('configToFormValues / formValuesToConfig round-trip', () => {
  it('converts config to form values and back', () => {
    const fields = [makeField('name'), makeField('bio')];
    const config = {
      fields: {
        name: { label: 'Full Name', order: 1 },
        bio: { component: 'Textarea' }
      }
    };

    const values = configToFormValues(config, fields);
    expect(values).toHaveProperty('components');
    expect(values).toHaveProperty('defaults');
    expect(values).toHaveProperty('fields');

    const fv = values.fields as Record<string, unknown>;
    expect(fv.name).toEqual({ label: 'Full Name', order: 1 });
    expect(fv.bio).toEqual({ component: 'Textarea' });

    const result = formValuesToConfig(values, config);
    expect(result.fields).toEqual(config.fields);
  });

  it('populates init-style defaults for plain HTML mode', () => {
    const values = configToFormValues(null, [makeField('x')], 'default');
    const comp = values.components as Record<string, unknown>;
    const def = values.defaults as Record<string, unknown>;
    expect(comp.source).toBe('./components');
    expect(comp.preset).toBeUndefined();
    expect(def.mode).toBe('submit');
    expect(def.ui).toBe('html');
    expect(def.serverAction).toBe(false);
    expect(def.formProvider).toBe(false);
  });

  it('populates init-style defaults for shadcn mode', () => {
    const values = configToFormValues(null, [makeField('x')], 'shadcn');
    const comp = values.components as Record<string, unknown>;
    const def = values.defaults as Record<string, unknown>;
    expect(comp.source).toBe('./components/ui');
    expect(comp.preset).toBe('shadcn');
    expect(def.mode).toBe('submit');
    expect(def.ui).toBe('shadcn');
  });

  it('user config overrides init defaults', () => {
    const config = {
      components: { source: './my-components' },
      defaults: { mode: 'auto-save', ui: 'shadcn' }
    };
    const values = configToFormValues(config, [makeField('x')], 'default');
    const comp = values.components as Record<string, unknown>;
    const def = values.defaults as Record<string, unknown>;
    expect(comp.source).toBe('./my-components');
    expect(def.mode).toBe('auto-save');
    expect(def.ui).toBe('shadcn');
  });

  it('omits empty entries from config', () => {
    const values = { components: {}, defaults: {}, fields: { name: undefined } };
    const result = formValuesToConfig(values, null);
    expect(result.fields).toBeUndefined();
    expect(result.components).toBeUndefined();
    expect(result.defaults).toBeUndefined();
  });

  it('omits entries where all properties are undefined', () => {
    const values = {
      components: {},
      defaults: {},
      fields: {
        name: {
          component: undefined,
          label: undefined,
          placeholder: undefined,
          order: undefined,
          hidden: undefined,
          gridColumn: undefined
        }
      }
    };
    const result = formValuesToConfig(values, null);
    expect(result.fields).toBeUndefined();
  });

  it('round-trips defaults section', () => {
    const config = {
      defaults: { mode: 'auto-save', ui: 'shadcn' }
    };
    const values = configToFormValues(config, [makeField('x')]);
    const result = formValuesToConfig(values, null);
    expect(result.defaults?.mode).toBe('auto-save');
    expect(result.defaults?.ui).toBe('shadcn');
  });

  it('round-trips components section', () => {
    const config = {
      components: { source: './components/ui', preset: 'shadcn' }
    };
    const values = configToFormValues(config, [makeField('x')]);
    const result = formValuesToConfig(values, null);
    expect(result.components?.source).toBe('./components/ui');
    expect(result.components?.preset).toBe('shadcn');
  });
});

describe('serializeConfigToTs / parseConfigFromTs round-trip', () => {
  it('generates full TypeScript with imports', () => {
    const ts = serializeConfigToTs(null, 'default');
    expect(ts).toContain("import { defineConfig } from '@zod-to-form/core'");
    expect(ts).toContain('import type * as Components from');
    expect(ts).toContain('export default defineConfig');
    expect(ts).toContain("mode: 'submit'");
    expect(ts).toContain("source: './components'");
  });

  it('round-trips config with fields through serialization', () => {
    const config = {
      fields: { name: { component: 'Textarea', label: 'Full Name' } }
    };
    const ts = serializeConfigToTs(config, 'default');
    expect(ts).toContain('"Textarea"');

    const parsed = parseConfigFromTs(ts);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.config.fields?.name).toBeTruthy();
    }
  });

  it('uses shadcn preset for shadcn componentMap', () => {
    const ts = serializeConfigToTs(null, 'shadcn');
    expect(ts).toContain("preset: 'shadcn'");
    expect(ts).toContain("ui: 'shadcn'");
    expect(ts).toContain("source: './components/ui'");
  });

  it('round-trips full init-style config', () => {
    const config = {
      components: { source: './components/ui', preset: 'shadcn' },
      defaults: { mode: 'submit', ui: 'shadcn' },
      fields: { name: { label: 'Name' } }
    };
    const ts = serializeConfigToTs(config, 'shadcn');
    const parsed = parseConfigFromTs(ts);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.config.components?.source).toBe('./components/ui');
      expect(parsed.config.defaults?.mode).toBe('submit');
      expect(parsed.config.fields?.name).toEqual({ label: 'Name' });
    }
  });

  it('parses bare JSON', () => {
    const result = parseConfigFromTs('{"fields": {"name": {"label": "Name"}}}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.fields).toEqual({ name: { label: 'Name' } });
    }
  });

  it('returns error for invalid syntax', () => {
    const result = parseConfigFromTs('not valid');
    expect(result.ok).toBe(false);
  });

  it('returns error for array input', () => {
    const result = parseConfigFromTs('[1, 2, 3]');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Config must be an object');
    }
  });

  it('handles defineConfig with trailing semicolon', () => {
    const result = parseConfigFromTs("defineConfig({ defaults: { mode: 'submit' } });");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.defaults?.mode).toBe('submit');
    }
  });

  it('handles defineConfig with generics', () => {
    const result = parseConfigFromTs(
      "defineConfig<typeof Components>({ defaults: { mode: 'submit' } });"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.defaults?.mode).toBe('submit');
    }
  });
});

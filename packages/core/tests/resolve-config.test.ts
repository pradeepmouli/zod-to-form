import { describe, expect, it } from 'vitest';
import * as core from '../src/index.js';

// A missing shared resolver is the first observable regression, rather than an import error.
const api = core as typeof core & {
  resolveFormConfig: (input: Record<string, unknown>) => any;
  mergeConfigLayers: (...layers: Record<string, unknown>[]) => any;
};
function resolve(config: Record<string, unknown>, variant?: string, invocation?: unknown) {
  expect(api.resolveFormConfig).toBeTypeOf('function');
  return api.resolveFormConfig({ config, exportName: 'User', variant, invocation });
}
function merge(...layers: Record<string, unknown>[]) {
  expect(api.mergeConfigLayers).toBeTypeOf('function');
  return api.mergeConfigLayers(...layers);
}
const base = { components: { source: './ui', preset: 'shadcn' } };

describe('canonical configuration resolution', () => {
  it('merges optimization properties without discarding inherited compilation', () => {
    expect(
      resolve(
        {
          ...base,
          defaults: { optimization: { level: 2, compileZod: true } },
          variants: { mobile: { defaults: { optimization: { level: 1 } } } }
        },
        'mobile'
      ).optimization
    ).toEqual({ level: 1, compileZod: true });
  });
  it('preserves explicit false and compile-only operation', () => {
    const config = merge(
      base,
      { defaults: { optimization: { compileZod: true } } },
      { defaults: { optimization: { compileZod: false } } }
    );
    expect(resolve(config).optimization).toEqual({ compileZod: false });
    expect(
      resolve(merge(base, { defaults: { optimization: { compileZod: true } } })).optimization
    ).toEqual({ compileZod: true });
  });
  it('expands only the final preset after a variant switches to html', () => {
    const authored = core.defineConfig({
      ...base,
      components: { source: './ui', preset: 'shadcn' },
      variants: { html: { components: { preset: 'html' } } }
    } as any);
    expect(resolve(authored, 'html').componentConfig.components.overrides).toEqual({});
    expect(resolve(authored).componentConfig.components.overrides.Checkbox.controlled).toBe(true);
  });
  it('replaces component entries but merges fields by property and replaces props', () => {
    const config = merge(
      {
        ...base,
        components: {
          ...base.components,
          overrides: { Select: { controlled: true, props: { a: 1 } } }
        },
        fields: { name: { hidden: true, props: { a: 1, b: 2 } } },
        include: ['Old'],
        schemas: { User: { name: 'Profile', fields: { name: { order: 3 } } } }
      },
      {
        components: { overrides: { Select: { controlled: false } } },
        fields: { name: { props: { c: 3 } } },
        include: ['User'],
        schemas: { User: { fields: { name: { disabled: true } } } }
      }
    );
    const result = resolve(config);
    expect(result.componentConfig.components.overrides.Select).toEqual({ controlled: false });
    expect(result.fields.name).toEqual({ hidden: true, props: { c: 3 }, order: 3, disabled: true });
    expect(result.componentConfig.include).toEqual(['User']);
    expect(result.componentName).toBe('Profile');
  });
  it('applies invocation settings over schema and defaults without changing reusable renderers', () => {
    const result = resolve(
      {
        ...base,
        defaults: { mode: 'submit', serverAction: true },
        schemas: { User: { mode: 'auto-save', component: 'Custom', name: 'Profile' } }
      },
      undefined,
      { mode: 'submit', serverAction: false, name: 'Invocation' }
    );
    expect(result).toMatchObject({
      mode: 'submit',
      serverAction: false,
      componentName: 'Invocation'
    });
    expect(result.componentConfig.schemas.User.component).toBe('Custom');
  });
  it('reports unknown variants and rejects nested variants', () => {
    expect(() => resolve({ ...base, variants: { mobile: {} } }, 'unknown')).toThrow(
      /unknown.*mobile/
    );
    expect(() => core.validateConfig({ ...base, variants: { bad: { variants: {} } } })).toThrow();
  });
  it.each(['mode', 'ui', 'validationLevel', 'componentConfig', 'componentName', 'overwrite'])(
    'rejects removed flat property %s instead of silently falling back',
    (key) => {
      expect(() =>
        core.validateConfig({ ...base, [key]: key === 'overwrite' ? true : 'wrong' })
      ).toThrow();
    }
  );
  it('validates enum settings and compiler flags in base and variant values', () => {
    for (const defaults of [
      { mode: 'wrong' },
      { ui: 'wrong' },
      { optimization: { compileZod: 'yes' } }
    ]) {
      expect(() => core.validateConfig({ ...base, defaults })).toThrow();
      expect(() => core.validateConfig({ ...base, variants: { mobile: { defaults } } })).toThrow();
    }
  });
});

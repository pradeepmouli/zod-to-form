import { describe, expect, it } from 'vitest';
import { buildEffectiveConfig } from '../../src/config/load.js';
import type { Z2FViteConfig } from '../../src/types.js';

/**
 * Contract: buildEffectiveConfig merges per-variant overrides on top of
 * the global config and rejects unknown variants. The plugin-internal
 * `__generate_<n>` variants always resolve to the base config (they
 * synthesize per-site cache entries; there's no per-site override).
 */
describe('buildEffectiveConfig', () => {
  const base: Z2FViteConfig = {
    componentName: 'UserForm',
    mode: 'submit',
    ui: 'html',
    variants: {
      edit: { componentName: 'UserEditForm' },
      create: { componentName: 'UserCreateForm', ui: 'shadcn' }
    }
  };

  it('returns the base config (minus the variants field) for the default variant', () => {
    const result = buildEffectiveConfig(base, '');
    expect(result.componentName).toBe('UserForm');
    expect(result.ui).toBe('html');
    // The variants field is stripped — generateFormComponent doesn't
    // know about it and would copy it through otherwise.
    expect((result as { variants?: unknown }).variants).toBeUndefined();
  });

  it('merges a named variant on top of the base config', () => {
    const result = buildEffectiveConfig(base, 'edit');
    expect(result.componentName).toBe('UserEditForm');
    // ui is not overridden by the edit variant, so the base value survives.
    expect(result.ui).toBe('html');
  });

  it('overrides multiple base fields when the variant supplies them', () => {
    const result = buildEffectiveConfig(base, 'create');
    expect(result.componentName).toBe('UserCreateForm');
    expect(result.ui).toBe('shadcn');
  });

  it('throws Z2F_VITE_UNKNOWN_VARIANT for an undeclared variant name', () => {
    expect(() => buildEffectiveConfig(base, 'nonexistent')).toThrow(/Z2F_VITE_UNKNOWN_VARIANT/);
  });

  it('error message lists known variants so the user can correct the typo', () => {
    try {
      buildEffectiveConfig(base, 'eddit');
      expect.fail('expected throw');
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain('edit');
      expect(message).toContain('create');
    }
  });

  it('throws (not silently) when no variants table is declared and a variant is requested', () => {
    const noVariants: Z2FViteConfig = {
      componentName: 'F',
      mode: 'submit',
      ui: 'html'
    };
    expect(() => buildEffectiveConfig(noVariants, 'edit')).toThrow(/Z2F_VITE_UNKNOWN_VARIANT/);
  });

  it('returns the base config for plugin-internal __generate_<n> variants', () => {
    // Rewrite-mode synthesizes one variant per site for cache keying;
    // they must NOT trigger UNKNOWN_VARIANT regardless of whether the
    // user declared any variants table.
    const result = buildEffectiveConfig(base, '__generate_1');
    expect(result.componentName).toBe('UserForm');
    expect(result.ui).toBe('html');
    const result2 = buildEffectiveConfig(base, '__generate_42');
    expect(result2.componentName).toBe('UserForm');
  });

  it('still rejects __generate_<non-digits> as an unknown variant', () => {
    expect(() => buildEffectiveConfig(base, '__generate_abc')).toThrow(/Z2F_VITE_UNKNOWN_VARIANT/);
  });

  it('does not deep-merge nested objects (variant fully replaces componentConfig)', () => {
    // Per the spec: variants typically swap whole sub-objects rather than
    // patch them. A nested merge would surprise users who expect their
    // variant override to fully replace the global subtree.
    const withNested: Z2FViteConfig = {
      componentName: 'F',
      mode: 'submit',
      ui: 'html',
      componentConfig: { components: { preset: 'shadcn', source: '@/global' } } as never,
      variants: {
        custom: { componentConfig: { components: { preset: 'html', source: '@/custom' } } as never }
      }
    };
    const result = buildEffectiveConfig(withNested, 'custom');
    // The variant's componentConfig fully replaced the global one.
    expect((result.componentConfig as { components: { source: string } }).components.source).toBe(
      '@/custom'
    );
  });
});

import { describe, expect, it } from 'vitest';
import { buildEffectiveConfig } from '../../src/config/load.js';
import type { ZodFormsConfig } from '@zod-to-form/core';

/**
 * Contract: buildEffectiveConfig merges per-variant overrides on top of
 * the global config and rejects unknown variants. The plugin-internal
 * `__generate_<n>` variants always resolve to the base config (they
 * synthesize per-site cache entries; there's no per-site override).
 */
describe('buildEffectiveConfig', () => {
  const base: ZodFormsConfig = {
    variants: {
      edit: {
        schemas: {
          ['signupSchema']: { name: 'UserEditForm' },
          ['userSchema']: { name: 'UserEditForm' },
          ['mySchema']: { name: 'UserEditForm' },
          ['activeSchema']: { name: 'UserEditForm' },
          ['TestSchema']: { name: 'UserEditForm' },
          ['testSchema']: { name: 'UserEditForm' },
          ['schema']: { name: 'UserEditForm' }
        }
      },
      create: {
        defaults: { ui: 'shadcn' },
        schemas: {
          ['signupSchema']: { name: 'UserCreateForm' },
          ['userSchema']: { name: 'UserCreateForm' },
          ['mySchema']: { name: 'UserCreateForm' },
          ['activeSchema']: { name: 'UserCreateForm' },
          ['TestSchema']: { name: 'UserCreateForm' },
          ['testSchema']: { name: 'UserCreateForm' },
          ['schema']: { name: 'UserCreateForm' }
        }
      }
    },
    components: { source: '@/components/ui', preset: 'html' },
    defaults: { mode: 'submit', ui: 'html' },
    schemas: {
      ['signupSchema']: { name: 'UserForm' },
      ['userSchema']: { name: 'UserForm' },
      ['mySchema']: { name: 'UserForm' },
      ['activeSchema']: { name: 'UserForm' },
      ['TestSchema']: { name: 'UserForm' },
      ['testSchema']: { name: 'UserForm' },
      ['schema']: { name: 'UserForm' }
    }
  };

  it('returns the base config (minus the variants field) for the default variant', () => {
    const result = buildEffectiveConfig(base, '');
    expect(result.schemas?.['signupSchema']?.name).toBe('UserForm');
    expect(result.defaults?.ui).toBe('html');
    // The variants field is stripped — generateFormComponent doesn't
    // know about it and would copy it through otherwise.
    expect((result as { variants?: unknown }).variants).toBeUndefined();
  });

  it('merges a named variant on top of the base config', () => {
    const result = buildEffectiveConfig(base, 'edit');
    expect(result.schemas?.['signupSchema']?.name).toBe('UserEditForm');
    // ui is not overridden by the edit variant, so the base value survives.
    expect(result.defaults?.ui).toBe('html');
  });

  it('overrides multiple base fields when the variant supplies them', () => {
    const result = buildEffectiveConfig(base, 'create');
    expect(result.schemas?.['signupSchema']?.name).toBe('UserCreateForm');
    expect(result.defaults?.ui).toBe('shadcn');
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
    const noVariants: ZodFormsConfig = {
      components: { source: '@/components/ui', preset: 'html' },
      defaults: { mode: 'submit', ui: 'html' },
      schemas: {
        ['signupSchema']: { name: 'F' },
        ['userSchema']: { name: 'F' },
        ['mySchema']: { name: 'F' },
        ['activeSchema']: { name: 'F' },
        ['TestSchema']: { name: 'F' },
        ['testSchema']: { name: 'F' },
        ['schema']: { name: 'F' }
      }
    };
    expect(() => buildEffectiveConfig(noVariants, 'edit')).toThrow(/Z2F_VITE_UNKNOWN_VARIANT/);
  });

  it('returns the base config for plugin-internal __generate_<n> variants', () => {
    // Rewrite-mode synthesizes one variant per site for cache keying;
    // they must NOT trigger UNKNOWN_VARIANT regardless of whether the
    // user declared any variants table.
    const result = buildEffectiveConfig(base, '__generate_1');
    expect(result.schemas?.['signupSchema']?.name).toBe('UserForm');
    expect(result.defaults?.ui).toBe('html');
    const result2 = buildEffectiveConfig(base, '__generate_42');
    expect(result2.schemas?.['signupSchema']?.name).toBe('UserForm');
  });

  it('still rejects __generate_<non-digits> as an unknown variant', () => {
    expect(() => buildEffectiveConfig(base, '__generate_abc')).toThrow(/Z2F_VITE_UNKNOWN_VARIANT/);
  });

  it('merges canonical component properties', () => {
    // Per the spec: variants typically swap whole sub-objects rather than
    // patch them. A nested merge would surprise users who expect their
    // variant override to fully replace the global subtree.
    const withNested: ZodFormsConfig = {
      components: {
        preset: 'shadcn',
        source: '@/global'
      },
      variants: {
        custom: ({ components: {
	preset: 'html',
	source: '@/custom'
} })
      },
      defaults: {
        mode: 'submit',
        ui: 'html'
      },
      schemas: {
        ['signupSchema']: { name: 'F' },
        ['userSchema']: { name: 'F' },
        ['mySchema']: { name: 'F' },
        ['activeSchema']: { name: 'F' },
        ['TestSchema']: { name: 'F' },
        ['testSchema']: { name: 'F' },
        ['schema']: { name: 'F' }
      }
    };
    const result = buildEffectiveConfig(withNested, 'custom');
    // The variant's componentConfig fully replaced the global one.
    expect(result.components.source).toBe('@/custom');
  });
});

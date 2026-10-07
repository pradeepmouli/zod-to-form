import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { compileTarget } from '../../src/query-mode/transform.js';
import type { ZodFormsConfig } from '@zod-to-form/core';

/**
 * Contract: every error path through the load pipeline produces a
 * Z2F_VITE_* error, never a generic Error or silent fallback.
 *
 * Most error cases (SCHEMA_NOT_FOUND, SCHEMA_NOT_ZOD, AMBIGUOUS_EXPORT,
 * UNKNOWN_VARIANT) are already covered by select-export.test.ts and
 * load-query.test.ts. This file fills the remaining gaps:
 *
 * - Empty namespace
 * - Variant override that itself produces a non-Zod export name
 */
describe('load pipeline error paths', () => {
  const baseConfig: ZodFormsConfig = {
    types: ['signupSchema'],
    components: { source: '@/components/ui', preset: 'html' },
    defaults: { mode: 'submit', ui: 'html' },
    schemas: { ['signupSchema']: { name: 'SignupForm' } }
  };

  it('throws SCHEMA_NOT_FOUND for a completely empty module namespace', () => {
    expect(() =>
      compileTarget({
        namespace: {},
        schemaFile: '/abs/empty.ts',
        variant: '',
        config: baseConfig
      })
    ).toThrow(/Z2F_VITE_SCHEMA_NOT_FOUND/);
  });

  it('throws AMBIGUOUS_EXPORT for two Zod exports with no exportName configured', () => {
    const ns = {
      signupSchema: z.object({ name: z.string() }),
      loginSchema: z.object({ email: z.string() })
    };
    expect(() =>
      compileTarget({
        namespace: ns,
        schemaFile: '/abs/x.ts',
        variant: '',
        // exportName cleared to trigger auto-detect
        config: { ...baseConfig, types: [] }
      })
    ).toThrow(/Z2F_VITE_AMBIGUOUS_EXPORT/);
  });

  it('honors variant exportName override (variant points at a different export)', () => {
    const ns = {
      userSchema: z.object({ name: z.string() }),
      adminSchema: z.object({ id: z.string(), role: z.literal('admin') })
    };
    const config: ZodFormsConfig = {
      ...baseConfig,
      types: ['userSchema'],
      variants: {
        admin: { types: ['adminSchema'], schemas: { ['adminSchema']: { name: 'AdminForm' } } }
      }
    };
    const result = compileTarget({
      namespace: ns,
      schemaFile: '/abs/users.ts',
      variant: 'admin',
      config
    });
    expect(result.generatedSource).toContain('AdminForm');
    expect(result.exportName).toBe('adminSchema');
  });

  it('variant exportName pointing at a non-existent export throws SCHEMA_NOT_FOUND', () => {
    const ns = { userSchema: z.object({ name: z.string() }) };
    const config: ZodFormsConfig = {
      ...baseConfig,
      types: ['userSchema'],
      variants: { broken: { types: ['nonexistent'] } }
    };
    expect(() =>
      compileTarget({
        namespace: ns,
        schemaFile: '/abs/users.ts',
        variant: 'broken',
        config
      })
    ).toThrow(/Z2F_VITE_SCHEMA_NOT_FOUND/);
  });
});

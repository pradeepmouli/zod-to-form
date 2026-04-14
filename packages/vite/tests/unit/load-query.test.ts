import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { compileTarget } from '../../src/query-mode/transform.js';
import type { Z2FViteConfig } from '../../src/types.js';

/**
 * Contract: compileTarget is the pure side of the `load` hook. Given a
 * loaded module namespace + the effective config + variant, it walks the
 * Zod schema and emits the same source string the CLI would produce.
 *
 * The actual ssrLoadModule / Rollup `this.load` plumbing happens in
 * plugin.ts and is exercised by integration tests (slice 3c).
 */
describe('compileTarget', () => {
  const baseConfig: Z2FViteConfig = {
    exportName: 'signupSchema',
    componentName: 'SignupForm',
    mode: 'submit',
    ui: 'html'
  };

  const namespace = {
    signupSchema: z.object({
      name: z.string().min(2),
      email: z.string().email()
    })
  };

  it('emits a non-empty .tsx source string', () => {
    const result = compileTarget({
      namespace,
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: '',
      config: baseConfig
    });
    expect(typeof result.generatedSource).toBe('string');
    expect(result.generatedSource.length).toBeGreaterThan(0);
  });

  it('emitted source contains the configured component name', () => {
    const result = compileTarget({
      namespace,
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: '',
      config: baseConfig
    });
    expect(result.generatedSource).toContain('SignupForm');
  });

  it('emitted source references the schema import path the codegen was given', () => {
    const result = compileTarget({
      namespace,
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: '',
      config: { ...baseConfig, schemaImportPath: './signup' }
    });
    expect(result.generatedSource).toContain("from './signup'");
  });

  it('returns null schemaLite when the schema has no top-level effects', () => {
    const result = compileTarget({
      namespace,
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: '',
      config: baseConfig
    });
    expect(result.schemaLiteSource).toBeNull();
  });

  it('returns a schemaLite source string when the schema has a top-level superRefine', () => {
    const ns = {
      pwSchema: z.object({ a: z.string(), b: z.string() }).superRefine((data, ctx) => {
        if (data.a !== data.b) {
          ctx.addIssue({ code: 'custom', message: 'mismatch', path: ['b'] });
        }
      })
    };
    const result = compileTarget({
      namespace: ns,
      schemaFile: '/abs/src/schemas/pw.ts',
      variant: '',
      config: { ...baseConfig, exportName: 'pwSchema', validationLevel: 1 }
    });
    expect(result.schemaLiteSource).not.toBeNull();
    expect(typeof result.schemaLiteSource).toBe('string');
  });

  it('throws SCHEMA_NOT_FOUND when the configured exportName is missing', () => {
    expect(() =>
      compileTarget({
        namespace,
        schemaFile: '/abs/src/schemas/signup.ts',
        variant: '',
        config: { ...baseConfig, exportName: 'nonexistent' }
      })
    ).toThrow(/Z2F_VITE_SCHEMA_NOT_FOUND/);
  });

  it('throws SCHEMA_NOT_ZOD when the configured export is not a Zod schema', () => {
    const ns = { signupSchema: { not: 'zod' } };
    expect(() =>
      compileTarget({
        namespace: ns,
        schemaFile: '/abs/src/schemas/signup.ts',
        variant: '',
        config: baseConfig
      })
    ).toThrow(/Z2F_VITE_SCHEMA_NOT_ZOD/);
  });

  it('uses the variant config when a named variant is requested', () => {
    const result = compileTarget({
      namespace,
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: 'edit',
      config: {
        ...baseConfig,
        variants: {
          edit: { componentName: 'SignupEditForm' }
        }
      }
    });
    expect(result.generatedSource).toContain('SignupEditForm');
  });

  it('throws UNKNOWN_VARIANT for variants that are not declared in config.variants', () => {
    expect(() =>
      compileTarget({
        namespace,
        schemaFile: '/abs/src/schemas/signup.ts',
        variant: 'nonexistent',
        config: baseConfig
      })
    ).toThrow(/Z2F_VITE_UNKNOWN_VARIANT/);
  });
});

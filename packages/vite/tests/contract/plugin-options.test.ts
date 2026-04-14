import { describe, expect, it } from 'vitest';
import { z2fVite } from '../../src/index.js';
import { Z2FViteError } from '../../src/errors.js';

/**
 * Contract: the z2fVite() factory accepts PluginOptions, validates them
 * synchronously (rejecting unknown keys and malformed values), and
 * returns a valid Vite Plugin object.
 *
 * Async validation that depends on the Vite root or filesystem (configPath
 * existence, write.outDir inside-root) happens in `configResolved` —
 * those are exercised by integration tests in slice 3c, not here.
 */
describe('z2fVite() factory', () => {
  it('returns a Vite Plugin with name @zod-to-form/vite', () => {
    const plugin = z2fVite();
    expect(plugin.name).toBe('@zod-to-form/vite');
  });

  it('returns a Vite Plugin with enforce: pre', () => {
    const plugin = z2fVite();
    expect(plugin.enforce).toBe('pre');
  });

  it('accepts an empty options object', () => {
    expect(() => z2fVite({})).not.toThrow();
  });

  it('accepts no arguments', () => {
    expect(() => z2fVite()).not.toThrow();
  });

  it('accepts every documented option key', () => {
    expect(() =>
      z2fVite({
        configPath: '/abs/z2f.config.ts',
        configOverride: { ui: 'shadcn' },
        rewrite: { include: ['src/**/*.tsx'], exclude: ['**/dist/**'] },
        write: { outDir: '/abs/out', filenamePattern: '{schemaBasename}.gen.tsx' },
        logLevel: 'debug'
      })
    ).not.toThrow();
  });

  it('accepts an empty rewrite object (opt-in without explicit globs)', () => {
    expect(() => z2fVite({ rewrite: {} })).not.toThrow();
  });

  describe('rejects unknown option keys', () => {
    it('throws Z2F_VITE_INVALID_OPTIONS for typos', () => {
      expect(() => z2fVite({ rewirte: {} } as never)).toThrow(/Z2F_VITE_INVALID_OPTIONS/);
    });

    it('throws Z2F_VITE_INVALID_OPTIONS for arbitrary unknown keys', () => {
      expect(() => z2fVite({ foo: 'bar' } as never)).toThrow(/Z2F_VITE_INVALID_OPTIONS/);
    });

    it('error message lists allowed keys to help the user fix the typo', () => {
      try {
        z2fVite({ rewirte: {} } as never);
        expect.fail('Expected z2fVite to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(Z2FViteError);
        expect((err as Error).message).toContain('rewrite');
      }
    });

    it('throws Z2F_VITE_INVALID_OPTIONS for unknown keys nested inside rewrite', () => {
      expect(() => z2fVite({ rewrite: { includ: [] } } as never)).toThrow(
        /Z2F_VITE_INVALID_OPTIONS/
      );
    });
  });

  describe('logLevel validation', () => {
    it('accepts every valid level', () => {
      for (const level of ['silent', 'warn', 'info', 'debug'] as const) {
        expect(() => z2fVite({ logLevel: level })).not.toThrow();
      }
    });

    it('rejects unknown levels', () => {
      expect(() => z2fVite({ logLevel: 'verbose' as never })).toThrow(/Z2F_VITE_INVALID_OPTIONS/);
    });
  });

  describe('default values applied when omitted', () => {
    // Defaults are observable through behavior, not directly inspectable on
    // the returned Plugin object. We verify the factory at least doesn't
    // mutate or crash when each individual option is absent.
    it('accepts a plain object without rewrite', () => {
      const plugin = z2fVite({ logLevel: 'silent' });
      expect(plugin.name).toBe('@zod-to-form/vite');
    });

    it('accepts a plain object without configPath', () => {
      const plugin = z2fVite({ rewrite: {} });
      expect(plugin.name).toBe('@zod-to-form/vite');
    });
  });
});

import { describe, expect, it } from 'vitest';
import { z2fVite } from '../../src/index.js';

/**
 * Contract: the plugin MUST NOT mutate `resolvedConfig.optimizeDeps.include`
 * or `.exclude` (beyond at most one harmless `?z2f` exclude entry to keep
 * Vite's dep optimizer from trying to prebundle our virtual modules).
 *
 * FR-014: developers must not be required to disable Vite's dep optimizer
 * or add workarounds to their vite config for typical usage.
 */
describe('plugin contract: optimizeDeps', () => {
  it('does not mutate optimizeDeps.include via the config hook', () => {
    const plugin = z2fVite();

    // If there's a `config` hook, call it with a mock UserConfig and
    // verify it doesn't add anything to optimizeDeps.include.
    const configHook = plugin.config;
    if (typeof configHook === 'function') {
      const mockUserConfig = { optimizeDeps: { include: ['react'], exclude: [] } };
      const mockEnv = { command: 'build' as const, mode: 'production' };
      const result = configHook.call({} as never, mockUserConfig as never, mockEnv);
      // Hook either returns void (no merge) or a partial UserConfig.
      // Any returned optimizeDeps.include MUST be empty/absent.
      if (result && typeof result === 'object' && 'optimizeDeps' in result) {
        const optimizeDeps = (result as { optimizeDeps?: { include?: string[] } }).optimizeDeps;
        expect(optimizeDeps?.include ?? []).toEqual([]);
      }
    }
    // If there's no config hook at all, the plugin obviously doesn't
    // mutate optimizeDeps. Pass.
  });

  it('does not pollute optimizeDeps.exclude with arbitrary entries', () => {
    const plugin = z2fVite();
    const configHook = plugin.config;
    if (typeof configHook === 'function') {
      const mockUserConfig = { optimizeDeps: { include: [], exclude: [] } };
      const mockEnv = { command: 'build' as const, mode: 'production' };
      const result = configHook.call({} as never, mockUserConfig as never, mockEnv);
      if (result && typeof result === 'object' && 'optimizeDeps' in result) {
        const optimizeDeps = (result as { optimizeDeps?: { exclude?: string[] } }).optimizeDeps;
        const exclude = optimizeDeps?.exclude ?? [];
        // The contract allows at most one harmless `?z2f` entry. We
        // accept zero entries OR one entry that contains the substring
        // `z2f` (so the plugin can document its presence). Anything else
        // is a contract violation.
        expect(exclude.length).toBeLessThanOrEqual(1);
        for (const entry of exclude) {
          expect(entry).toContain('z2f');
        }
      }
    }
  });
});

/**
 * @zod-to-form/vite — public entry.
 *
 * Exports the plugin factory `z2fVite()` and the public types consumers
 * need to type their `vite.config.ts` and plugin options.
 */
import type { Plugin } from 'vite';
import type { PluginOptions } from './types.js';
import { Z2FViteError } from './errors.js';

export type {
  PluginOptions,
  Z2FViteConfig,
  VariantConfigs,
  WriteOptions,
  GenerationTarget,
  CompilationEntry,
  RewriteSite,
  HMRInvalidationMap
} from './types.js';
export { Z2FViteError, formatZ2FViteError } from './errors.js';
export type { Z2FViteErrorCode, Z2FViteErrorLocation } from './errors.js';

const PLUGIN_NAME = '@zod-to-form/vite';

/**
 * Factory function that returns a Vite plugin instance.
 *
 * In Phase 2 (current), this is a no-op stub: it validates options, sets
 * the plugin name, and registers no hooks. Phase 3 (User Story 1) wires
 * up `resolveId` / `load` / `configureServer` / `handleHotUpdate` for
 * query-mode generation; later phases add rewrite mode, config watching,
 * and resolver tree-shaking.
 */
export function z2fVite(options: PluginOptions = {}): Plugin {
  validateOptions(options);

  return {
    name: PLUGIN_NAME,
    enforce: 'pre'
    // resolveId, load, configureServer, transform, handleHotUpdate, buildEnd
    // are added in Phase 3+.
  };
}

export default z2fVite;

/**
 * Synchronous, factory-time validation of plugin options.
 * Async checks (configPath existence, write.outDir inside-root) happen
 * during `configResolved` once Vite has told us the project root.
 */
function validateOptions(options: PluginOptions): void {
  // Reject unknown keys via TypeScript's strict object typing at compile
  // time. At runtime we still validate the shape to catch JS callers and
  // to provide clearer errors than "undefined is not a function".
  const allowedKeys = new Set([
    'configPath',
    'configOverride',
    'rewriteZodForm',
    'rewriteInclude',
    'rewriteExclude',
    'write',
    'logLevel'
  ]);
  for (const key of Object.keys(options)) {
    if (!allowedKeys.has(key)) {
      throw new Z2FViteError(
        'Z2F_VITE_INVALID_OPTIONS',
        `Unknown plugin option: '${key}'. Allowed: ${Array.from(allowedKeys).sort().join(', ')}.`
      );
    }
  }

  if (options.logLevel !== undefined) {
    const valid = new Set(['silent', 'warn', 'info', 'debug']);
    if (!valid.has(options.logLevel)) {
      throw new Z2FViteError(
        'Z2F_VITE_INVALID_OPTIONS',
        `Invalid logLevel '${String(options.logLevel)}'. Allowed: silent, warn, info, debug.`
      );
    }
  }
}

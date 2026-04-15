/**
 * @zod-to-form/vite — public entry.
 *
 * Exports the plugin factory `z2fVite()` and the public types consumers
 * need to type their `vite.config.ts` and plugin options.
 */
export { z2fVite, default } from './plugin.js';

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

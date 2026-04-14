/**
 * Plugin hook wiring.
 *
 * This module assembles the Vite plugin object. Each hook delegates to a
 * pure helper that has its own unit-test coverage:
 *
 * - `resolveId` → `resolveZ2FId`
 * - `load`      → `parseZ2FId` + cache lookup + `compileTarget`
 * - `handleHotUpdate` → `computeHmrInvalidation` + module-graph translation
 * - `configureServer` → captures the dev server reference for `load`
 *
 * Phase 5 (US3 config watching) extends this file. Phase 4 (US2 rewrite
 * mode) and Phase 6 (US4 resolver tree-shake) add a `transform` hook
 * alongside the existing ones.
 */
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { createCompilationCache } from './cache.js';
import type { CompilationCache } from './cache.js';
import { configHash } from './config/load.js';
import { Z2FViteError } from './errors.js';
import { cacheKeyToModuleId, computeHmrInvalidation } from './hmr.js';
import { createLogger } from './logger.js';
import type { Logger } from './logger.js';
import { parseZ2FId, resolveZ2FId } from './query-mode/resolve-id.js';
import { compileTarget } from './query-mode/transform.js';
import type { GenerationTarget, PluginOptions, Z2FViteConfig } from './types.js';

const PLUGIN_NAME = '@zod-to-form/vite';

/**
 * Default config used when no `z2f.config.ts` is present and no
 * `configOverride` was supplied. The user can still pass `?z2f=variant`
 * — it will throw UNKNOWN_VARIANT, which is the right error for "you
 * referenced a variant but never declared one anywhere".
 */
const DEFAULT_CONFIG: Z2FViteConfig = {
  exportName: '',
  componentName: 'Form',
  mode: 'submit',
  ui: 'html'
};

interface PluginState {
  options: PluginOptions;
  logger: Logger;
  cache: CompilationCache;
  /** Captured during configResolved. */
  resolvedConfig: ResolvedConfig | null;
  /** Captured during configureServer. Null in build mode. */
  devServer: ViteDevServer | null;
  /** The plugin's effective Z2FViteConfig — populated lazily on first load. */
  z2fConfig: Z2FViteConfig | null;
  /** Resolved absolute path to z2f.config.ts (or null if none). */
  configFilePath: string | null;
}

export function z2fVite(options: PluginOptions = {}): Plugin {
  validateOptions(options);

  const state: PluginState = {
    options,
    logger: createLogger(options.logLevel ?? 'info'),
    cache: createCompilationCache(),
    resolvedConfig: null,
    devServer: null,
    z2fConfig: null,
    configFilePath: null
  };

  return {
    name: PLUGIN_NAME,
    enforce: 'pre',

    configResolved(resolved): void {
      state.resolvedConfig = resolved;
    },

    configureServer(server): void {
      state.devServer = server;
    },

    async resolveId(source, importer): Promise<string | null> {
      // Cheap substring check before parseSpecifier
      if (!source.includes('?z2f')) return null;

      // Resolve the path portion through Vite's standard resolver so
      // aliases, tsconfig paths, and resolve.extensions all work normally.
      const queryIndex = source.indexOf('?');
      const pathPart = source.slice(0, queryIndex);
      const resolvedPath = await this.resolve(pathPart, importer, { skipSelf: true });
      if (resolvedPath === null) {
        throw new Z2FViteError(
          'Z2F_VITE_SCHEMA_NOT_FOUND',
          `Could not resolve schema path '${pathPart}' for specifier '${source}'.`
        );
      }

      const root = state.resolvedConfig?.root ?? process.cwd();
      return resolveZ2FId(source, resolvedPath.id, root);
    },

    async load(id): Promise<string | null> {
      const parsed = parseZ2FId(id);
      if (parsed === null) return null;

      const z2fConfig = await ensureConfig(state);
      const effectiveConfigForHash = {
        ...z2fConfig,
        // Variant-specific fields are merged inside compileTarget; the
        // hash here covers the global config plus the variant slice.
        _variant: parsed.variant
      };
      const hash = configHash(effectiveConfigForHash as never);

      // Build the target for the cache lookup. exportName will be the
      // user-configured value (or empty string for auto-detect mode).
      const target: GenerationTarget = {
        schemaFile: parsed.schemaFile,
        exportName: z2fConfig.exportName ?? '',
        variant: parsed.variant,
        configHash: hash,
        componentName: z2fConfig.componentName ?? 'Form',
        sourceKind: 'query'
      };

      const cached = state.cache.get(target);
      if (cached !== undefined) {
        state.logger.debug(`load cache hit for ${id}`);
        return cached.generatedSource;
      }

      // Cache miss: load the schema module and compile it.
      const namespace = await loadSchemaModule(state, parsed.schemaFile, this);
      const result = compileTarget({
        namespace,
        schemaFile: parsed.schemaFile,
        variant: parsed.variant,
        config: z2fConfig
      });

      // Update the target with the actually-selected exportName so future
      // cache lookups with the same `id` hit (the inferred name is part
      // of the cache identity).
      const finalTarget: GenerationTarget = {
        ...target,
        exportName: result.exportName,
        componentName: result.effectiveConfig.componentName ?? 'Form'
      };

      state.cache.set(finalTarget, {
        target: finalTarget,
        generatedSource: result.generatedSource,
        schemaLiteSource: result.schemaLiteSource,
        sourceMap: null,
        emittedAt: Date.now()
      });

      state.logger.debug(`load cache miss for ${id} → compiled`);
      return result.generatedSource;
    },

    handleHotUpdate(ctx): undefined {
      const result = computeHmrInvalidation({
        changedFile: ctx.file,
        configFile: state.configFilePath ?? undefined,
        cache: state.cache
      });

      if (result === null) {
        // Not our file — let Vite's default HMR run.
        return undefined;
      }

      // Translate evicted cache keys to Vite module ids and add the
      // matching ModuleNodes to ctx.modules so Vite invalidates them.
      const moduleIds = result.evictedKeys.map(cacheKeyToModuleId);
      const moduleGraph = state.devServer?.moduleGraph;
      if (moduleGraph !== undefined) {
        for (const moduleId of moduleIds) {
          const moduleNodes = moduleGraph.getModulesByFile(moduleId);
          if (moduleNodes !== undefined) {
            for (const node of moduleNodes) {
              ctx.modules.push(node);
            }
          }
          // Also try direct id lookup (virtual modules are tracked by id)
          const node = moduleGraph.getModuleById(moduleId);
          if (node !== undefined) {
            ctx.modules.push(node);
          }
        }
      }

      state.logger.debug(
        `HMR ${result.kind} invalidation for ${ctx.file}: ${result.evictedKeys.length} entries`
      );
      // Returning ctx.modules tells Vite to invalidate the listed modules.
      // Returning undefined lets Vite walk the module graph itself based
      // on the file change — which it will do anyway for the schema file.
      return undefined;
    }
  };
}

export default z2fVite;

// ─── Helpers ─────────────────────────────────────────────────────────

function validateOptions(options: PluginOptions): void {
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

/**
 * Load (or return cached) the user's `z2f.config.ts`, merging
 * `options.configOverride` on top.
 *
 * Slice 3b ships a minimal version: if the user passed `configPath`, we
 * try to load it via the dev server's `ssrLoadModule` (or a future build-
 * time loader); otherwise we fall back to `DEFAULT_CONFIG` merged with
 * `options.configOverride`. Slice 3c adds proper file discovery and
 * watching — see Phase 5 (US3) for the watching half.
 */
async function ensureConfig(state: PluginState): Promise<Z2FViteConfig> {
  if (state.z2fConfig !== null) return state.z2fConfig;

  let loaded: Partial<Z2FViteConfig> = {};

  if (state.options.configPath !== undefined) {
    state.configFilePath = state.options.configPath;
    if (state.devServer !== null) {
      try {
        const mod = await state.devServer.ssrLoadModule(state.options.configPath);
        loaded =
          (mod as { default?: Partial<Z2FViteConfig> }).default ?? (mod as Partial<Z2FViteConfig>);
      } catch (err) {
        throw new Z2FViteError(
          'Z2F_VITE_CONFIG_INVALID',
          `Failed to load config '${state.options.configPath}': ${(err as Error).message}`,
          { file: state.options.configPath }
        );
      }
    }
  }

  state.z2fConfig = {
    ...DEFAULT_CONFIG,
    ...loaded,
    ...state.options.configOverride
  };
  return state.z2fConfig;
}

/**
 * Load a schema module via the appropriate Vite mechanism (dev or build).
 *
 * Dev: `server.ssrLoadModule(schemaFile)` — respects Vite's transform
 * pipeline so TypeScript and other plugins fire normally.
 *
 * Build: `pluginContext.load({ id: schemaFile })` then evaluate. For
 * slice 3b we keep the dev path only; the build path lands in slice 3c
 * when the integration tests need it.
 */
async function loadSchemaModule(
  state: PluginState,
  schemaFile: string,
  // The Rollup PluginContext from inside `load`. We don't import its
  // type because Vite re-exports a wrapped variant; `unknown` keeps the
  // signature loose without sacrificing safety inside this file.
  _ctx: unknown
): Promise<Record<string, unknown>> {
  if (state.devServer !== null) {
    return state.devServer.ssrLoadModule(schemaFile);
  }
  // Build mode is implemented in slice 3c (integration tests).
  throw new Z2FViteError(
    'Z2F_VITE_CODEGEN_FAILURE',
    `Build-mode schema loading is not yet implemented in slice 3b. Schema: ${schemaFile}`,
    { file: schemaFile }
  );
}

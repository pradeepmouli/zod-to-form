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
 */
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { createCompilationCache } from './cache.js';
import type { CompilationCache } from './cache.js';
import { configHash } from './config/load.js';
import { Z2FViteError } from './errors.js';
import { computeHmrInvalidation } from './hmr.js';
import { createLogger } from './logger.js';
import type { Logger } from './logger.js';
import { parseZ2FId, resolveZ2FId } from './query-mode/resolve-id.js';
import { compileTarget } from './query-mode/transform.js';
import type { GenerationTarget, PluginOptions, Z2FViteConfig } from './types.js';

const PLUGIN_NAME = '@zod-to-form/vite';

/**
 * Default config used when no `z2f.config.ts` is present and no
 * `configOverride` was supplied. `exportName` is omitted so the plugin
 * auto-detects the single Zod schema export.
 */
const DEFAULT_CONFIG: Z2FViteConfig = {
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
      // Hash the full z2fConfig (including `variants`). The variant name is
      // carried separately by the cache key, so buildEffectiveConfig's
      // per-variant merge doesn't need to be reflected in the hash — any
      // change to the `variants` table bumps the hash for every variant.
      const hash = configHash(z2fConfig);

      // Build the cache-lookup target. `exportName` is set to the
      // user-configured value or an empty sentinel — the actually-selected
      // name lands on `finalTarget` below after compileTarget resolves it.
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
      const namespace = await loadSchemaModule(state, parsed.schemaFile);
      const result = compileTarget({
        namespace,
        schemaFile: parsed.schemaFile,
        variant: parsed.variant,
        config: z2fConfig
      });

      // Promote the actually-selected exportName so future cache lookups
      // with the same `id` hit (the inferred name is part of the cache
      // entry's identity).
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

      // Translate evicted cache keys to the Vite module graph entries that
      // need invalidation. Each cache key has the form
      // `<schemaFile>::<variant>::<configHash>` and maps to a virtual module
      // whose id is `<schemaFile>?z2f[=variant]`. `getModulesByFile` wants
      // the bare source path (not the id), while `getModuleById` wants the
      // full id with query — we hit both so whichever index Vite has
      // populated gets flushed.
      const moduleGraph = state.devServer?.moduleGraph;
      if (moduleGraph !== undefined) {
        const seen = new Set<string>();
        let unmatched = 0;
        for (const key of result.evictedKeys) {
          const parts = key.split('::');
          const schemaFile = parts[0];
          const variant = parts[1];
          if (parts.length !== 3 || schemaFile === undefined || variant === undefined) {
            state.logger.warn(`malformed cache key during HMR: ${key}`);
            continue;
          }
          const query = variant === '' ? '?z2f' : `?z2f=${variant}`;
          const moduleId = `${schemaFile}${query}`;

          let matched = false;
          const byFile = moduleGraph.getModulesByFile(schemaFile);
          if (byFile !== undefined) {
            for (const node of byFile) {
              const nodeKey = node.id ?? node.url ?? '';
              if (!seen.has(nodeKey)) {
                seen.add(nodeKey);
                ctx.modules.push(node);
                matched = true;
              }
            }
          }
          const byId = moduleGraph.getModuleById(moduleId);
          if (byId !== undefined) {
            const nodeKey = byId.id ?? byId.url ?? '';
            if (!seen.has(nodeKey)) {
              seen.add(nodeKey);
              ctx.modules.push(byId);
              matched = true;
            }
          }
          if (!matched) unmatched += 1;
        }
        if (unmatched > 0) {
          state.logger.warn(
            `HMR: ${unmatched}/${result.evictedKeys.length} evicted cache keys had no matching module in Vite's graph — those consumers may show stale output until the next full reload`
          );
        }
      }

      state.logger.debug(
        `HMR ${result.kind} invalidation for ${ctx.file}: ${result.evictedKeys.length} entries`
      );
      return undefined;
    }
  };
}

export default z2fVite;

// ─── Helpers ─────────────────────────────────────────────────────────

function validateOptions(options: PluginOptions): void {
  const allowedKeys = new Set(['configPath', 'configOverride', 'rewrite', 'write', 'logLevel']);
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

  if (options.rewrite !== undefined) {
    const rewriteAllowed = new Set(['include', 'exclude']);
    for (const key of Object.keys(options.rewrite)) {
      if (!rewriteAllowed.has(key)) {
        throw new Z2FViteError(
          'Z2F_VITE_INVALID_OPTIONS',
          `Unknown 'rewrite.${key}' option. Allowed: ${Array.from(rewriteAllowed).sort().join(', ')}.`
        );
      }
    }
  }
}

/**
 * Load (or return cached) the user's `z2f.config.ts`, merging
 * `options.configOverride` on top. If no `configPath` is set, falls back
 * to `DEFAULT_CONFIG` merged with `options.configOverride`.
 *
 * Build-mode config loading (via `this.load` inside a plugin context) is
 * not yet implemented — if the user explicitly supplied a `configPath`
 * but there's no dev server, we throw rather than silently dropping the
 * user's config.
 */
async function ensureConfig(state: PluginState): Promise<Z2FViteConfig> {
  if (state.z2fConfig !== null) return state.z2fConfig;

  let loaded: Partial<Z2FViteConfig> = {};

  if (state.options.configPath !== undefined) {
    state.configFilePath = state.options.configPath;
    if (state.devServer === null) {
      throw new Z2FViteError(
        'Z2F_VITE_NOT_IMPLEMENTED',
        `Build-mode loading of 'configPath' is not yet implemented. Pass the config object inline via 'configOverride' until the build-time loader lands.`,
        { file: state.options.configPath }
      );
    }
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
  } else {
    state.logger.info(
      `no configPath supplied — compiling forms with defaults. Pass 'configPath' or 'configOverride' to customize.`
    );
  }

  state.z2fConfig = {
    ...DEFAULT_CONFIG,
    ...loaded,
    ...state.options.configOverride
  };
  return state.z2fConfig;
}

/**
 * Load a schema module via the dev server's SSR pipeline (so TypeScript
 * and other plugins fire normally). Build-mode loading via the Rollup
 * `PluginContext.load` path is not yet implemented.
 *
 * `ssrLoadModule` can throw for many reasons — TS syntax error, import
 * failure, evaluation error inside the schema file — so we wrap every
 * failure in a typed `Z2F_VITE_CODEGEN_FAILURE` with the schema file
 * attached, rather than letting raw Vite stack traces leak to the user.
 */
async function loadSchemaModule(
  state: PluginState,
  schemaFile: string
): Promise<Record<string, unknown>> {
  if (state.devServer === null) {
    throw new Z2FViteError(
      'Z2F_VITE_NOT_IMPLEMENTED',
      `Build-mode schema loading is not yet implemented. Use 'vite dev' or wait for the build-time loader.`,
      { file: schemaFile }
    );
  }
  try {
    return await state.devServer.ssrLoadModule(schemaFile);
  } catch (err) {
    throw new Z2FViteError(
      'Z2F_VITE_CODEGEN_FAILURE',
      `Failed to load schema module '${schemaFile}': ${(err as Error).message}`,
      { file: schemaFile }
    );
  }
}

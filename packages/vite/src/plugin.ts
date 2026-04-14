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
import path from 'node:path';
import { promises as fs } from 'node:fs';
import {
  createServer,
  transformWithEsbuild,
  type Plugin,
  type ResolvedConfig,
  type ViteDevServer
} from 'vite';
import { createCompilationCache } from './cache.js';
import type { CompilationCache } from './cache.js';
import { configHash } from './config/load.js';
import { Z2FViteError } from './errors.js';
import { computeHmrInvalidation } from './hmr.js';
import { createLogger } from './logger.js';
import type { Logger } from './logger.js';
import { parseZ2FId, resolveZ2FId } from './query-mode/resolve-id.js';
import { compileTarget } from './query-mode/transform.js';
import { resolveSchemas } from './rewrite-mode/resolve-schema.js';
import { rewriteSource } from './rewrite-mode/rewrite-source.js';
import { scanJsx } from './rewrite-mode/scan-jsx.js';
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
  /** Counters for rewrite-mode summary at buildEnd. */
  rewriteFilesProcessed: number;
  rewriteSitesRewritten: number;
  /** Compiled rewrite include/exclude pattern matchers. */
  rewriteInclude: RegExp[] | null;
  rewriteExclude: RegExp[];
  /** Captured during configResolved. */
  resolvedConfig: ResolvedConfig | null;
  /** Captured during configureServer. Null in build mode. */
  devServer: ViteDevServer | null;
  /**
   * In build mode, a transient middleware-mode dev server spun up to
   * provide `ssrLoadModule` for schema evaluation. Lazily created on the
   * first build-mode load and torn down at `buildEnd`. Null in dev mode
   * (where `devServer` does the same job).
   */
  buildModeServer: ViteDevServer | null;
  /** The plugin's effective Z2FViteConfig — populated lazily on first load. */
  z2fConfig: Z2FViteConfig | null;
  /**
   * The most recent successfully-loaded config. Survives across config
   * reloads so a syntax error in `z2f.config.ts` mid-session can fall
   * back to the previous valid version (FR-010 / SC-008).
   */
  lastValidConfig: Z2FViteConfig | null;
  /** Resolved absolute path to z2f.config.ts (or null if none). */
  configFilePath: string | null;
}

export function z2fVite(options: PluginOptions = {}): Plugin {
  validateOptions(options);

  const state: PluginState = {
    options,
    logger: createLogger(options.logLevel ?? 'info'),
    cache: createCompilationCache(),
    rewriteFilesProcessed: 0,
    rewriteSitesRewritten: 0,
    // Default include = every TS/JS source file. Defaults set lazily so
    // the empty `rewrite: {}` case still gets sensible globbing.
    rewriteInclude:
      options.rewrite === undefined
        ? null
        : compileGlobs(options.rewrite.include ?? ['**/*.{ts,tsx,js,jsx}']),
    rewriteExclude:
      options.rewrite === undefined
        ? []
        : compileGlobs([...(options.rewrite.exclude ?? []), '**/node_modules/**', '**/dist/**']),
    resolvedConfig: null,
    devServer: null,
    buildModeServer: null,
    z2fConfig: null,
    lastValidConfig: null,
    configFilePath: null
  };

  const isRewriteEnabled = options.rewrite !== undefined;

  return {
    name: PLUGIN_NAME,
    enforce: 'pre',

    configResolved(resolved): void {
      state.resolvedConfig = resolved;
    },

    configureServer(server): void {
      state.devServer = server;
    },

    async buildEnd(): Promise<void> {
      // Flush the rewrite-mode skip summary at info level (or higher).
      if (isRewriteEnabled) {
        state.logger.flushRewriteSummary(state.rewriteFilesProcessed, state.rewriteSitesRewritten);
      }
      // Tear down the transient SSR loader spun up for build-mode schema
      // evaluation. Safe to call even if it was never created.
      if (state.buildModeServer !== null) {
        await state.buildModeServer.close();
        state.buildModeServer = null;
      }
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
      const compiled = compileTarget({
        namespace,
        schemaFile: parsed.schemaFile,
        variant: parsed.variant,
        config: z2fConfig
      });

      // generateFormComponent emits TSX, but the virtual module id keeps
      // the schema's `.ts` extension — esbuild won't apply JSX parsing
      // unless we tell it. Run the source through esbuild here so the
      // returned `code` is valid JavaScript that the rest of Vite's
      // pipeline can treat normally. Source maps from esbuild stack on
      // top of the (currently null) plugin sourcemap.
      const transformed = await transformWithEsbuild(compiled.generatedSource, `${id}.tsx`, {
        loader: 'tsx',
        sourcemap: true
      });
      const result = {
        ...compiled,
        generatedSource: transformed.code
      };

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

    async transform(code, id) {
      // Rewrite mode is opt-in (FR-024); when `options.rewrite` is
      // undefined the hook is a no-op for every file.
      if (!isRewriteEnabled) return null;

      // Strip the query string before glob-matching so `?z2f` virtual ids
      // aren't accidentally targeted (the substring check below would also
      // exclude them, but this saves the parse).
      const queryIdx = id.indexOf('?');
      const filePath = queryIdx === -1 ? id : id.slice(0, queryIdx);

      // Glob-filter against include / exclude. Filenames must match at
      // least one include pattern and zero exclude patterns.
      if (!matchesAny(filePath, state.rewriteInclude ?? [])) return null;
      if (matchesAny(filePath, state.rewriteExclude)) return null;

      // Substring fast-path inside scanJsx returns null for files without
      // ZodForm — keep this hook's overhead at zero for the common case.
      const scan = scanJsx(code);
      if (scan === null) return null;

      state.rewriteFilesProcessed += 1;

      // Buffer scan-time skip diagnostics through the logger.
      for (const skip of scan.skipped) {
        state.logger.bufferRewriteSkip(filePath, skip.loc.line, skip.loc.column, skip.reason);
      }

      if (scan.candidates.length === 0) {
        return null;
      }

      // Resolve schemas via Vite's resolver so aliases / tsconfig paths fire.
      const root = state.resolvedConfig?.root ?? process.cwd();
      const resolvePluginContext = this;
      const resolved = await resolveSchemas({
        source: code,
        candidates: scan.candidates,
        sourceFile: filePath,
        viteRoot: root,
        resolveImport: async (specifier, importer): Promise<string | null> => {
          const r = await resolvePluginContext.resolve(specifier, importer, { skipSelf: true });
          return r === null ? null : r.id;
        }
      });

      // Buffer resolve-time skip diagnostics.
      for (const skip of resolved.skipped) {
        state.logger.bufferRewriteSkip(
          filePath,
          skip.candidate.loc.line,
          skip.candidate.loc.column,
          skip.reason
        );
      }

      if (resolved.resolved.length === 0) {
        return null;
      }

      const result = rewriteSource({ source: code, resolved: resolved.resolved });
      state.rewriteSitesRewritten += result.rewritten;
      return { code: result.code, map: result.map };
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

      // On a config-file change, drop the cached effective config so the
      // next `load` call re-reads `z2f.config.ts` through ssrLoadModule.
      // `lastValidConfig` is preserved so a syntax error rolls back
      // gracefully (see ensureConfig's catch path).
      if (result.kind === 'config') {
        state.z2fConfig = null;
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

/**
 * Compile a list of glob patterns into RegExps. Supports `**` (any path),
 * `*` (any segment), and `{a,b}` (alternation) — enough for the rewrite
 * include/exclude config without pulling in a full glob library.
 */
function compileGlobs(patterns: ReadonlyArray<string>): RegExp[] {
  return patterns.map((p) => globToRegex(p));
}

function globToRegex(glob: string): RegExp {
  // Convert glob to regex: handle braces, then `**`, then `*`, then `?`,
  // escaping every other regex metacharacter.
  let result = '';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i]!;
    if (c === '*') {
      if (glob[i + 1] === '*') {
        result += '.*';
        i += 2;
        continue;
      }
      result += '[^/]*';
      i += 1;
      continue;
    }
    if (c === '?') {
      result += '[^/]';
      i += 1;
      continue;
    }
    if (c === '{') {
      const close = glob.indexOf('}', i);
      if (close === -1) {
        result += '\\{';
        i += 1;
        continue;
      }
      const inner = glob
        .slice(i + 1, close)
        .split(',')
        .map((s) => s.replace(/[.+^$()|[\]\\]/g, '\\$&'));
      result += '(?:' + inner.join('|') + ')';
      i = close + 1;
      continue;
    }
    if (/[.+^$(){}|[\]\\]/.test(c)) {
      result += '\\' + c;
    } else {
      result += c;
    }
    i += 1;
  }
  return new RegExp('^' + result + '$');
}

function matchesAny(filePath: string, patterns: ReadonlyArray<RegExp>): boolean {
  // Normalize separators for cross-platform matching.
  const normalized = filePath.replace(/\\/g, '/');
  return patterns.some((p) => p.test(normalized));
}

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
 * Standard `z2f.config.*` filenames probed by auto-discovery, in priority
 * order. The first existing one wins.
 */
const CONFIG_CANDIDATES = ['z2f.config.ts', 'z2f.config.mts', 'z2f.config.js', 'z2f.config.mjs'];

/**
 * Walk the candidate config filenames in `root` and return the absolute
 * path of the first one that exists, or `null` if none do.
 */
async function discoverConfigPath(root: string): Promise<string | null> {
  for (const name of CONFIG_CANDIDATES) {
    const candidate = path.join(root, name);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Not present — try the next.
    }
  }
  return null;
}

/**
 * Load (or return cached) the user's `z2f.config.ts`, merging
 * `options.configOverride` on top.
 *
 * Resolution order:
 *   1. `options.configPath` if explicitly set
 *   2. Auto-discovery of `z2f.config.{ts,mts,js,mjs}` in the Vite root
 *   3. Fall back to `DEFAULT_CONFIG` merged with `options.configOverride`
 *
 * If a load attempt FAILS and we already had a previously-valid config
 * (from before an HMR-triggered reload), we keep the old config and log
 * a warning. This is the FR-010 / SC-008 "dev server stays alive when
 * the config has a syntax error" contract — the user can fix the file
 * and the next save will retry.
 */
async function ensureConfig(state: PluginState): Promise<Z2FViteConfig> {
  if (state.z2fConfig !== null) return state.z2fConfig;

  // Resolve the config file path on first call.
  if (state.configFilePath === null) {
    if (state.options.configPath !== undefined) {
      state.configFilePath = state.options.configPath;
    } else {
      const root = state.resolvedConfig?.root ?? process.cwd();
      state.configFilePath = await discoverConfigPath(root);
      if (state.configFilePath !== null) {
        state.logger.debug(`auto-discovered config at ${state.configFilePath}`);
      }
    }
  }

  let loaded: Partial<Z2FViteConfig> = {};

  if (state.configFilePath !== null) {
    const loader = state.devServer ?? (await ensureBuildModeServer(state));
    try {
      // Force re-read after a config-file HMR by invalidating Vite's
      // own SSR module cache for the file. Without this the loader hands
      // back the stale namespace.
      const moduleNode = loader.moduleGraph.getModuleById(state.configFilePath);
      if (moduleNode !== undefined) {
        loader.moduleGraph.invalidateModule(moduleNode);
      }
      const mod = await loader.ssrLoadModule(state.configFilePath);
      loaded =
        (mod as { default?: Partial<Z2FViteConfig> }).default ?? (mod as Partial<Z2FViteConfig>);
    } catch (err) {
      // If we have a previously-valid config (this is an HMR-triggered
      // reload after the user introduced a syntax error), log and keep
      // the old one so the dev server stays serving.
      if (state.lastValidConfig !== null) {
        state.logger.warn(
          `failed to reload config '${state.configFilePath}' (${(err as Error).message}); keeping previous valid config`
        );
        state.z2fConfig = state.lastValidConfig;
        return state.z2fConfig;
      }
      throw new Z2FViteError(
        'Z2F_VITE_CONFIG_INVALID',
        `Failed to load config '${state.configFilePath}': ${(err as Error).message}`,
        { file: state.configFilePath }
      );
    }
  } else if (state.options.configOverride === undefined) {
    state.logger.info(
      `no z2f.config.* found in project root and no configOverride supplied — compiling forms with defaults`
    );
  }

  state.z2fConfig = {
    ...DEFAULT_CONFIG,
    ...loaded,
    ...state.options.configOverride
  };
  state.lastValidConfig = state.z2fConfig;
  return state.z2fConfig;
}

/**
 * Load a schema module via the appropriate SSR loader.
 *
 * In dev mode we use the captured `state.devServer.ssrLoadModule`. In
 * build mode there is no dev server, so we lazily spin up a transient
 * middleware-mode server with a near-empty config (no plugins beyond
 * the user's config-resolved root) and use IT for `ssrLoadModule`. The
 * transient server inherits the user's `resolve`, `define`, and
 * tsconfig-paths plumbing through Vite's normal config discovery, so
 * the schema evaluation matches what dev mode would see — guaranteeing
 * SC-006 byte-for-byte parity.
 *
 * `ssrLoadModule` can throw for many reasons — TS syntax error, import
 * failure, runtime error inside the schema file — so we wrap every
 * failure in a typed `Z2F_VITE_CODEGEN_FAILURE` with the schema file
 * attached, rather than letting raw Vite stack traces leak to the user.
 */
async function loadSchemaModule(
  state: PluginState,
  schemaFile: string
): Promise<Record<string, unknown>> {
  const loader = state.devServer ?? (await ensureBuildModeServer(state));
  try {
    return await loader.ssrLoadModule(schemaFile);
  } catch (err) {
    throw new Z2FViteError(
      'Z2F_VITE_CODEGEN_FAILURE',
      `Failed to load schema module '${schemaFile}': ${(err as Error).message}`,
      { file: schemaFile }
    );
  }
}

/**
 * Lazily create the transient build-mode SSR server. Reuses the user's
 * resolved Vite config (root, resolve aliases, tsconfig paths) but skips
 * the plugin pipeline — including this plugin itself — so we don't
 * recursively trigger `?z2f` resolution while loading user schemas.
 */
async function ensureBuildModeServer(state: PluginState): Promise<ViteDevServer> {
  if (state.buildModeServer !== null) return state.buildModeServer;

  const root = state.resolvedConfig?.root ?? process.cwd();
  const userResolve = state.resolvedConfig?.resolve;

  const server = await createServer({
    root,
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true },
    // Inherit the user's resolve config (aliases, tsconfig paths) so the
    // transient server sees imports the same way the real build does.
    ...(userResolve !== undefined ? { resolve: userResolve } : {})
  });

  state.buildModeServer = server;
  return server;
}

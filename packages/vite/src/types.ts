/**
 * Type definitions for `@zod-to-form/vite`.
 *
 * Shapes are derived directly from `specs/007-vite-codegen-plugin/data-model.md`
 * — entities #1 (PluginOptions), #2 (GenerationTarget), #3 (CompilationCache
 * via CompilationEntry), #4 (GenerateSite), #5 (HMRInvalidationMap).
 *
 * The `CodegenConfig` referenced here is the canonical type from
 * `@zod-to-form/core` (moved there during this feature so the Vite plugin
 * can depend on it without pulling in the codegen package's runtime).
 */
import type { CodegenConfig } from '@zod-to-form/core';

// ─── 1. PluginOptions ────────────────────────────────────────────────

/**
 * Variant overrides keyed by the `?z2f=<name>` query value.
 * Per-variant settings merge on top of the global `CodegenConfig`.
 *
 * @useWhen
 * - You need different generated form styles for the same schema (e.g. `?z2f=mobile` vs `?z2f=desktop`)
 * - You want variant-specific UI presets or component overrides without separate schema files
 *
 * @avoidWhen
 * - You only have a single form variant — omit this field entirely and use the global config
 *
 * @config
 * @category Plugin Types
 */
export type VariantConfigs = Record<string, Partial<CodegenConfig>>;

/**
 * The full config the Vite plugin operates on: a base `CodegenConfig`
 * plus optional per-variant overrides.
 *
 * `exportName` is relaxed to optional at the plugin boundary — the plugin
 * auto-detects a single Zod schema export when the user omits it, and
 * throws `Z2F_VITE_AMBIGUOUS_EXPORT` on ambiguity. The codegen package
 * still requires it, and the plugin promotes the resolved name before
 * invoking codegen.
 *
 * @remarks
 * Place this in `z2f.config.ts` as a default export. The plugin auto-discovers
 * that file from the Vite root (searches `z2f.config.{ts,mts,js,mjs}` in order).
 * Use `defineConfig` from `@zod-to-form/core` for type-safe config authoring.
 *
 * @useWhen
 * - Centralizing form generation options for all `?z2f` imports in a project
 * - Applying a consistent UI preset (shadcn/html) and field overrides across forms
 *
 * @avoidWhen
 * - You only need a single one-off form — pass `configOverride` to `z2fVite()` instead
 *
 * @never
 * - NEVER place `z2f.config.ts` outside the Vite root — the auto-discovery only searches
 *   `resolvedConfig.root` and will silently fall back to defaults if the file is not found
 * - NEVER export an async function as the config default — only plain objects are supported;
 *   async evaluation is not handled by `ssrLoadModule`
 *
 * @config
 * @category Plugin Types
 */
export type Z2FViteConfig = Omit<CodegenConfig, 'exportName'> & {
  exportName?: string;
  /** Per-variant overrides. Keyed by `?z2f=<name>` query value. */
  variants?: VariantConfigs;
};

/**
 * Optional disk-write settings. When omitted, generated forms are served
 * as virtual modules only (no files written).
 */
export interface WriteOptions {
  /**
   * Directory for emitted files. If undefined, write each generated file
   * beside its source schema.
   */
  outDir?: string;
  /**
   * File naming pattern with substitution tokens.
   * Default: `'{schemaBasename}.{variant}.generated.tsx'`.
   */
  filenamePattern?: string;
}

/**
 * Plugin options passed to `z2fVite(options)`. Every field is optional;
 * the bare `z2fVite()` invocation produces a working plugin.
 *
 * @remarks
 * Pass this to `z2fVite()` in your `vite.config.ts`. Only known keys are
 * accepted — unknown keys throw `Z2F_VITE_INVALID_OPTIONS` at startup.
 *
 * @useWhen
 * - Pointing the plugin to a non-standard config file path (`configPath`)
 * - Enabling generate mode to rewrite `<ZodForm>` call sites at build time (`generate`)
 * - Overriding config programmatically without a `z2f.config.ts` (`configOverride`)
 * - Adjusting diagnostic verbosity (`logLevel`)
 *
 * @avoidWhen
 * - You want zero-config usage — the bare `z2fVite()` call with no options works out of the box
 *
 * @never
 * - NEVER set `generate: {}` in production without auditing what files it matches — by default
 *   it targets all `**\/*.{ts,tsx,js,jsx}` and rewrites every `<ZodForm>` call site it can
 *   statically resolve, which changes compiled output the developer didn't explicitly annotate
 * - NEVER pass unknown option keys — the plugin validates the options object at startup and
 *   throws `Z2F_VITE_INVALID_OPTIONS` for any unrecognized key
 *
 * @config
 * @category Plugin Types
 */
export interface PluginOptions {
  /**
   * Path to `z2f.config.{ts,js,mjs}`. Auto-discovered from the Vite root
   * if undefined.
   */
  configPath?: string;

  /** Shallow override merged on top of the loaded config. */
  configOverride?: Partial<Z2FViteConfig>;

  /**
   * Generate mode: scan JSX source for `<ZodForm>` elements and replace
   * statically resolvable call sites with generated form components at
   * build time. The name mirrors the CLI's `zod-to-form generate`
   * command — it's the same codegen, driven by static analysis of your
   * JSX instead of explicit CLI invocation.
   *
   * **OFF by default** (FR-024): generate mode silently changes compiled
   * output for code the developer didn't explicitly annotate, so it is a
   * deliberate opt-in. Presence of this object (even empty `{}`) enables
   * it; omit the field entirely to keep it off. This avoids the invalid
   * state where `include` is set but the mode is disabled.
   */
  generate?: {
    /** Glob patterns for files generate mode should consider. */
    include?: string[];
    /** Glob patterns excluded from generate mode. */
    exclude?: string[];
  };

  /** Optional opt-in to emit generated files to disk. */
  write?: WriteOptions;

  /** Plugin-specific log level. Independent of Vite's log level. */
  logLevel?: 'silent' | 'warn' | 'info' | 'debug';
}

// ─── 2. GenerationTarget ─────────────────────────────────────────────

/**
 * Shared fields every target carries regardless of origin.
 * Split into a base type so the discriminated union below stays DRY.
 */
interface GenerationTargetBase {
  /** Absolute, normalized path to the schema source file. Identity. */
  schemaFile: string;

  /** The named export to pick from the schema module (e.g. `'signupSchema'`). */
  exportName: string;

  /**
   * SHA-256 hex digest of the canonicalized effective config for this
   * target. Two equal configs MUST produce identical hashes; any meaningful
   * change MUST produce a different hash.
   */
  configHash: string;

  /** Derived component name (e.g. `'SignupForm'`, `'SignupEditForm'`). */
  componentName: string;
}

/**
 * A single (schema, variant, config) triple that produces exactly one
 * generated form. The cache key space.
 *
 * Discriminated on `sourceKind`: query-mode targets carry a user-named
 * variant (or empty string for the default), while generate-mode targets
 * use the reserved `__generate_<n>` prefix. Encoding the prefix in the
 * type system prevents accidentally crossing the streams.
 */
export type GenerationTarget =
  | (GenerationTargetBase & {
      sourceKind: 'query';
      /**
       * Variant name from the `?z2f=<variant>` query, or empty string for
       * the default variant. MUST NOT start with `__generate_` (enforced
       * at runtime by `parseSpecifier`).
       */
      variant: string;
    })
  | (GenerationTargetBase & {
      sourceKind: 'generate';
      /** Synthesized variant name — always `__generate_<n>`. */
      variant: `__generate_${string}`;
    });

// ─── 3. CompilationCache (entries) ───────────────────────────────────

/**
 * One cached compilation result. The cache stores entries keyed by
 * `${schemaFile}::${variant}::${configHash}`.
 */
export interface CompilationEntry {
  /** The triple that produced this entry. */
  target: GenerationTarget;

  /** The `.tsx` source emitted by `generateFormComponent`. */
  generatedSource: string;

  /**
   * The companion `.lite.ts` source emitted by `generateSchemaLiteFile`,
   * or `null` if the walk produced no top-level effects.
   */
  schemaLiteSource: string | null;

  /** Reserved for a future sourcemap back to the original schema. */
  sourceMap: unknown;

  /** `Date.now()` at compile time. Used for debug logging and HMR ordering. */
  emittedAt: number;
}

// ─── 4. GenerateSite ──────────────────────────────────────────────────

/**
 * A single `<ZodForm>` JSX element matched by generate mode.
 * Lives only during a single `transform` call — not persisted.
 */
export interface GenerateSite {
  /** Absolute path to the source file containing the matched `<ZodForm>` site. */
  sourceFile: string;

  /** Byte range of the original `<ZodForm>` element in the source file. */
  range: { start: number; end: number };

  /** Absolute path to the schema file the `schema={X}` identifier resolves to. */
  schemaFile: string;

  /** Export name of the identifier in the schema module. */
  exportName: string;

  /**
   * Local identifier that replaces `ZodForm` at this call site.
   * Unique within the source file.
   */
  generatedIdentifier: string;

  /**
   * Synthesized variant name for cache keying. Always `__generate_<n>` where
   * `<n>` is a per-source-file counter.
   */
  variant: string;
}

// ─── 5. HMRInvalidationMap ───────────────────────────────────────────

/**
 * The graph edges that `handleHotUpdate` walks when a watched file changes.
 *
 * Built incrementally as the plugin sees `resolveId` / `load` / `transform`
 * calls. Reset on dev server restart.
 */
export interface HMRInvalidationMap {
  /** For each schema file, the set of cache keys depending on it. */
  schemaToTargets: Map<string, Set<string>>;

  /** For each schema file, the set of Vite module ids that import it. */
  schemaToImporters: Map<string, Set<string>>;

  /** For each cache entry, the set of modules that import its virtual id. */
  targetToImporters: Map<string, Set<string>>;

  /** All modules that depend on the config (for config-change fan-out). */
  configWatchers: Set<string>;
}

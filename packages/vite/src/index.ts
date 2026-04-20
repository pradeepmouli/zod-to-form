/**
 * Vite plugin for zod-to-form — transforms `?z2f` imports into generated form components and replaces `<ZodForm>` JSX call sites with static output at build time.
 *
 * Two modes:
 * - **Query mode** (`?z2f` imports): import a schema file with a `?z2f` query
 *   parameter to receive a fully-generated React form component as a virtual
 *   module. Zero build step — the plugin compiles on demand.
 * - **Generate mode** (`options.generate`): scan JSX source files for
 *   `<ZodForm>` call sites and replace statically-resolvable ones with
 *   generated form components at build time. Opt-in via `generate: {}`.
 *
 * Config resolution order:
 *   1. `options.configPath` if explicitly provided
 *   2. Auto-discovery of `z2f.config.{ts,mts,js,mjs}` in the Vite root
 *   3. `DEFAULT_CONFIG` merged with `options.configOverride`
 *
 * @remarks
 * Two modes: `?z2f` query imports (transform per-import, HMR works) vs `generate` mode
 * (static JSX rewriting, no HMR integration). Use `?z2f` for new forms, `generate` for
 * migrating existing `<ZodForm>` call sites.
 *
 * @useWhen
 * - You want zero-config form generation directly from `import './schema?z2f'` — the plugin intercepts the import and returns a virtual form module
 * - You have a Vite-based app and want to skip the CLI generate step — no separate codegen script needed
 * - You need per-variant forms (mobile/desktop) from the same schema — append `?z2f=variantName` to get a separate compiled output
 * - You want HMR-aware form recompilation during development — schema file changes invalidate only the affected virtual modules
 *
 * @avoidWhen
 * - You are NOT using Vite — use `@zod-to-form/cli` for webpack, esbuild, or Rollup builds
 * - Your schema files have cyclic type references — the `?z2f` rewriter recurses on Zod's type graph and will hang on cycles
 * - You need SSR-safe form HTML without a client-side React bundle — static codegen produces lighter server-renderable output
 * - You are on Zod v3 — the plugin only supports Zod v4 schemas
 *
 * @pitfalls
 * - NEVER use `?z2f` on schemas with cyclic type references — the schema
 *   walker recurses on Zod's type graph and hits infinite recursion on cycles
 * - NEVER enable `rewrite` (generate mode) with HMR simultaneously without
 *   testing — the in-memory compilation cache has invalidation gaps when
 *   source files are changed mid-session and the module graph is stale
 * - NEVER assume Zod schema objects survive Vite's module graph isolation
 *   intact — always re-export schemas from a dedicated file so `ssrLoadModule`
 *   can evaluate them without pulling in unrelated runtime dependencies
 * - NEVER place schema files outside the Vite root when using `ssrLoadModule` —
 *   schemas outside the Vite root may fail to resolve their own imports
 *   — produces Z2F_VITE_SCHEMA_OUTSIDE_ROOT error
 * - NEVER put your `z2f.config.ts` outside the Vite root — auto-discovery
 *   only searches `resolvedConfig.root`; files outside that boundary are
 *   silently skipped and the plugin falls back to defaults
 * - NEVER mix `configOverride` with a `z2f.config.ts` that overlaps the
 *   same keys — `configOverride` wins unconditionally (shallow merge), so
 *   config-file fields with the same name are silently dropped
 *
 * @packageDocumentation
 */
export { z2fVite, default } from './plugin.js';

export type {
  PluginOptions,
  Z2FViteConfig,
  VariantConfigs,
  WriteOptions,
  GenerationTarget,
  CompilationEntry,
  GenerateSite,
  HMRInvalidationMap
} from './types.js';
export { Z2FViteError, formatZ2FViteError } from './errors.js';
export type { Z2FViteErrorCode, Z2FViteErrorLocation } from './errors.js';

/**
 * Vite plugin for schema-driven form generation.
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
 * Requires Zod v4 and `@zod-to-form/core`. The plugin uses Vite's
 * `ssrLoadModule` to evaluate schema files — the same Vite resolver pipeline
 * that handles your app code, so aliases and tsconfig paths all work.
 *
 * HMR contract: schema file changes invalidate only the affected virtual
 * modules. Config file (`z2f.config.ts`) changes invalidate all cached
 * compiled forms and trigger re-compilation on the next import.
 *
 * @useWhen
 * - You want zero-config form generation directly from `import './schema?z2f'`
 * - You have a Vite-based app and want to skip the CLI generate step
 * - You need per-variant forms (mobile/desktop) from the same schema
 * - You want HMR-aware form recompilation during development
 *
 * @avoidWhen
 * - You are NOT using Vite (use `@zod-to-form/cli` for non-Vite builds)
 * - Your schema files have cyclic type references — the `?z2f` rewriter
 *   recurses on Zod's type graph and will hang on cycles
 * - You need SSR-safe form HTML without a client-side React bundle
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

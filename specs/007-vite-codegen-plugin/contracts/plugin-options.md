# Contract: Plugin Factory and Options

**Interface**: public API of `@zod-to-form/vite`
**Consumers**: users' `vite.config.ts`
**Stability**: semver-public; breaking changes bump the package major

---

## Factory signature

```ts
import type { Plugin } from 'vite';

export function z2fVite(options?: PluginOptions): Plugin;
export default z2fVite;
```

- The factory function MUST accept zero arguments (invoked as `z2fVite()`) and MUST return a valid Vite plugin object.
- When invoked with `options`, those options MUST NOT mutate any shared state between calls — each invocation returns an independent plugin instance.
- Both named (`z2fVite`) and default exports MUST be provided for interoperability with both ESM and CommonJS user configs.

## Registered plugin name

The returned `Plugin.name` MUST equal `'@zod-to-form/vite'`. Vite uses plugin names in debug output and duplicate-detection; a stable name is required.

## Plugin hook contract

| Hook | Presence | Purpose | Failure behavior |
|---|---|---|---|
| `config` | required | Merge any necessary Vite config (e.g., add `?z2f` to `optimizeDeps.exclude`) | Throw on invalid user-provided plugin options |
| `configureServer` | required | Capture the dev server reference for programmatic `ssrLoadModule` calls in `load` | Log warning if server shape is unexpected; do not throw |
| `resolveId` | required | Recognize `?z2f` specifiers and return a resolved id | Return `null` on unrelated ids (standard Vite plugin convention) |
| `load` | required | Compile the schema into the generated form module source | Throw with a clear error that names the schema file and the failure reason (FR-010) |
| `transform` | required when `rewriteZodForm` is true | Scan JSX for `<ZodForm>` and rewrite statically resolvable sites; strip `zodResolver` when optimization is enabled | Throw only for actual parse failures; silently skip unmatched sites |
| `handleHotUpdate` | required | Invalidate affected cached entries and return the module set Vite should HMR | Fall through to default behavior on any error — never break the dev server |
| `buildEnd` | optional | Flush the compilation cache and log stats if `logLevel === 'debug'` | No-op on error |

## `PluginOptions` type

```ts
export interface PluginOptions {
  /** Path to z2f.config.{ts,js,mjs}. Auto-discovered from Vite root if undefined. */
  configPath?: string;

  /** Shallow override merged on top of the loaded config. */
  configOverride?: Partial<import('@zod-to-form/core').CodegenConfig>;

  /**
   * When true, scan JSX source for `<ZodForm>` elements and rewrite statically
   * resolvable call sites to use generated components. OFF by default (FR-024).
   */
  rewriteZodForm?: boolean;

  /** Glob patterns for files rewrite mode scans. Default: ['** /*.{ts,tsx,js,jsx}']. */
  rewriteInclude?: string[];

  /** Glob patterns excluded from rewrite mode. Always excludes node_modules. */
  rewriteExclude?: string[];

  /**
   * Optional opt-in to emit generated files to disk alongside schemas or into
   * `outDir`. When undefined, generated forms are served as virtual modules only.
   */
  write?: {
    /** Directory for emitted files. If undefined, write beside each schema file. */
    outDir?: string;
    /** File naming pattern. Default: '{schemaBasename}.{variant}.generated.tsx'. */
    filenamePattern?: string;
  };

  /** Plugin-specific log level. Independent of Vite's log level. */
  logLevel?: 'silent' | 'warn' | 'info' | 'debug';
}
```

### Required validation at factory invocation

- If `configPath` is provided, resolve it to an absolute path and confirm it exists synchronously. Fail fast if not found.
- If `write.outDir` is provided, resolve it to an absolute path and confirm it is inside the project's resolved Vite root (checked during `configResolved`). Fail fast if outside.
- If `rewriteZodForm` is false and `rewriteInclude`/`rewriteExclude` are provided, emit a warning via the plugin's logger.
- Unknown keys in `options` MUST produce a typed error at the TypeScript level (via strict object typing). No runtime tolerance for typos.

### Default values

| Option | Default |
|---|---|
| `configPath` | auto-discovered walking up from Vite `root` |
| `configOverride` | `undefined` (no override) |
| `rewriteZodForm` | `false` |
| `rewriteInclude` | `['**/*.{ts,tsx,js,jsx}']` |
| `rewriteExclude` | `['**/node_modules/**', '**/dist/**']` |
| `write` | `undefined` (virtual-module only) |
| `logLevel` | `'info'` |

## Error contract

Errors thrown by the plugin MUST carry a stable `code` string and a `location` (file + optional line/column) where applicable. Error classes:

| Code | When thrown | Recovery |
|---|---|---|
| `Z2F_VITE_CONFIG_NOT_FOUND` | `configPath` points to a missing file | Developer fixes the path or removes the option |
| `Z2F_VITE_CONFIG_INVALID` | Config file loads but fails validation | Dev server keeps last-good config until fixed |
| `Z2F_VITE_SCHEMA_NOT_FOUND` | `?z2f` import points to a file that doesn't exist | Import error surfaces in the browser overlay |
| `Z2F_VITE_SCHEMA_NOT_ZOD` | Resolved file's default (or named) export is not a Zod v4 schema | Developer exports a schema or fixes the name |
| `Z2F_VITE_UNKNOWN_VARIANT` | `?z2f=name` uses a variant name not declared in `config.variants` | Developer adds the variant to the config |
| `Z2F_VITE_CODEGEN_FAILURE` | `generateFormComponent` throws while processing a resolved schema | Dev server preserves last-known-good generated module |
| `Z2F_VITE_REWRITE_PARSE_ERROR` | Babel fails to parse a TSX file targeted by rewrite mode | Propagates as a normal Vite parse error |

All errors MUST be recoverable during `vite dev` — the dev server never dies because of a plugin error. On `vite build`, errors abort the build with a non-zero exit code.

## Stability promises

- **Added in v1.0**: `z2fVite`, `PluginOptions`, all documented error codes.
- **Reserved for future**: `PluginOptions.experimental` — an untyped bag for flags under development. Anything inside it is explicitly NOT covered by semver.

Non-documented internals (hook implementations, cache structures, helper types) are NOT part of the contract and may change in any release.

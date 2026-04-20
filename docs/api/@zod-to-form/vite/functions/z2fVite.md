[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / z2fVite

# Function: z2fVite()

> **z2fVite**(`options?`): `Plugin`

Defined in: [packages/vite/src/plugin.ts:147](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/vite/src/plugin.ts#L147)

Vite plugin factory for `@zod-to-form/vite`.

Registers Vite hooks for:
- **Query mode** (`resolveId` + `load`): intercepts `*.ts?z2f[=variant]` imports,
  evaluates the schema via `ssrLoadModule`, and returns a virtual module containing
  the generated React form component.
- **Generate mode** (`transform`): when `options.generate` is set, scans JSX source
  files for `<ZodForm schema={X}>` and rewrites resolvable call sites with generated
  components at build time.
- **Resolver tree-shake** (`transform`): removes `zodResolver` calls from `useZodForm`
  at build time when `validationLevel` is set, allowing bundlers to drop the
  `@hookform/resolvers` dependency.
- **HMR** (`handleHotUpdate`): invalidates cached compiled forms when their schema or
  the `z2f.config.ts` changes.

## Parameters

### options?

[`PluginOptions`](../interfaces/PluginOptions.md) = `{}`

Optional plugin configuration. All fields are optional; `z2fVite()`
  with no arguments produces a working plugin using auto-discovered config.

## Returns

`Plugin`

A Vite `Plugin` object to include in `vite.config.ts`.

## Example

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { z2fVite } from '@zod-to-form/vite';

export default defineConfig({
  plugins: [z2fVite()],
});
```

## Use When

- You want `import SignupForm from './signup.schema?z2f'` to Just Work in a Vite app — the plugin intercepts the import and compiles the form on demand
- You want HMR-aware form recompilation when schemas change in development — only the affected virtual modules are invalidated
- You want to run generate mode to pre-compile forms from `<ZodForm>` call sites — opt in via `generate: {}` in plugin options

## Avoid When

- You are building with webpack, esbuild, Rollup, or any non-Vite bundler — use `@zod-to-form/cli` instead
- Your schemas have cyclic references — the walker will recurse infinitely on them; break cycles before using the plugin
- You need server-side form rendering without a React runtime — static codegen produces lighter SSR-compatible output

## Never

- NEVER use `?z2f` on schemas with cyclic type references — the schema walker
  recurses on Zod's internal type graph and hangs with no error or timeout;
  FIX: break cycles with `z.lazy()` before using the `?z2f` import
- NEVER enable `generate` mode and then rely on HMR without testing — the
  generate-mode transform cache does not integrate with Vite's standard HMR
  module invalidation for rewritten JSX files; FIX: disable generate mode during
  development and only enable it in production builds
- NEVER configure `configPath` to point outside the Vite `root` — the plugin
  uses `ssrLoadModule` with a dev server scoped to `root`, so files outside
  that boundary may fail to resolve their own imports; FIX: move the config into
  the Vite root or set `root` to include it — produces Z2F_VITE_SCHEMA_OUTSIDE_ROOT error

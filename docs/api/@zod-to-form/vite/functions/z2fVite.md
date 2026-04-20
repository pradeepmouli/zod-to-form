[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / z2fVite

# Function: z2fVite()

> **z2fVite**(`options?`): `Plugin`

Defined in: [packages/vite/src/plugin.ts:147](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/vite/src/plugin.ts#L147)

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

- You want `import SignupForm from './signup.schema?z2f'` to Just Work in a Vite app
- You want HMR-aware form recompilation when schemas change in development
- You want to run generate mode to pre-compile forms from `<ZodForm>` call sites

## Avoid When

- You are building with webpack, esbuild, Rollup, or any non-Vite bundler
- Your schemas have cyclic references — the walker will recurse infinitely on them
- You need server-side form rendering without a React runtime

## Pitfalls

- NEVER use `?z2f` on schemas with cyclic type references — the schema walker
  recurses on Zod's internal type graph and hangs on cycles
- NEVER enable `generate` mode and then rely on HMR without testing — the
  generate-mode transform cache does not integrate with Vite's standard HMR
  module invalidation for rewritten JSX files
- NEVER assume Zod types survive Vite's module graph isolation — always export
  schemas from a dedicated `.schema.ts` file; importing from a module that
  re-exports through complex chains can fail under `ssrLoadModule`
- NEVER configure `configPath` to point outside the Vite `root` — the plugin
  uses `ssrLoadModule` with a dev server scoped to `root`, so files outside
  that boundary may fail to resolve their own imports

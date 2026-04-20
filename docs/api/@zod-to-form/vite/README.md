[**Documentation v0.2.0**](../../README.md)

***

[Documentation](../../README.md) / @zod-to-form/vite

# @zod-to-form/vite

Vite plugin for [zod-to-form](https://github.com/pradeepmouli/zod-to-form). Transforms `?z2f` imports into generated form components and (opt-in) rewrites `<ZodForm>` JSX call sites into generated components at build time — all with no separate codegen CLI step.

> **Status**: In active development. See [`specs/007-vite-codegen-plugin/`](../../_media/007-vite-codegen-plugin) for the full specification, plan, and implementation tasks.

## Quickstart

See the full walkthrough in [quickstart.md](../../_media/quickstart.md).

Minimal usage:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import z2fVite from '@zod-to-form/vite';

export default defineConfig({
  plugins: [z2fVite(), react()]
});
```

```tsx
// src/App.tsx
import SignupForm from './schemas/signup.ts?z2f';

export default function App() {
  return <SignupForm onSubmit={(data) => console.log(data)} />;
}
```

## Modes

- **Query-string mode** (default): imports carrying `?z2f` become generated form components.
- **Generate mode** (opt-in via `generate: {}`): scans source for `<ZodForm schema={X}>` usages and replaces statically resolvable ones with generated components at build time. Unresolvable sites are left alone and fall through to the runtime path. Presence of the `generate` object — even empty — enables the mode; pass `generate: { include: [...], exclude: [...] }` to constrain which files are scanned. The name mirrors the CLI's `zod-to-form generate` command: same codegen, driven by static analysis instead of an explicit CLI step.

## License

MIT

Vite plugin for zod-to-form — transforms `?z2f` imports into generated form components and replaces `<ZodForm>` JSX call sites with static output at build time.

Two modes:
- **Query mode** (`?z2f` imports): import a schema file with a `?z2f` query
  parameter to receive a fully-generated React form component as a virtual
  module. Zero build step — the plugin compiles on demand.
- **Generate mode** (`options.generate`): scan JSX source files for
  `<ZodForm>` call sites and replace statically-resolvable ones with
  generated form components at build time. Opt-in via `generate: {}`.

Config resolution order:
  1. `options.configPath` if explicitly provided
  2. Auto-discovery of `z2f.config.{ts,mts,js,mjs}` in the Vite root
  3. `DEFAULT_CONFIG` merged with `options.configOverride`

## Remarks

Two modes: `?z2f` query imports (transform per-import, HMR works) vs `generate` mode
(static JSX rewriting, no HMR integration). Use `?z2f` for new forms, `generate` for
migrating existing `<ZodForm>` call sites.

## Use When

- You want zero-config form generation directly from `import './schema?z2f'` — the plugin intercepts the import and returns a virtual form module
- You have a Vite-based app and want to skip the CLI generate step — no separate codegen script needed
- You need per-variant forms (mobile/desktop) from the same schema — append `?z2f=variantName` to get a separate compiled output
- You want HMR-aware form recompilation during development — schema file changes invalidate only the affected virtual modules

## Avoid When

- You are NOT using Vite — use `@zod-to-form/cli` for webpack, esbuild, or Rollup builds
- Your schema files have cyclic type references — the `?z2f` rewriter recurses on Zod's type graph and will hang on cycles
- You need SSR-safe form HTML without a client-side React bundle — static codegen produces lighter server-renderable output
- You are on Zod v3 — the plugin only supports Zod v4 schemas

## Never

- NEVER use `?z2f` on schemas with cyclic type references — the schema walker
  recurses on Zod's internal type graph and hangs with no timeout or error;
  FIX: break cycles by extracting shared types into a `z.lazy()` boundary before
  using the `?z2f` import
- NEVER assume Zod schema objects survive Vite's module graph isolation intact —
  `ssrLoadModule` evaluates modules in a fresh context, so schemas imported from
  barrel files that also import React/RHF may fail due to missing peer globals;
  FIX: re-export schemas from a dedicated `.schema.ts` file with no non-schema imports
- NEVER mix `configOverride` with a `z2f.config.ts` that overlaps the same keys —
  `configOverride` wins unconditionally (shallow merge), silently dropping config-file
  fields; FIX: use either `configPath` + a full config file, or `configOverride` only

## Errors

- [Z2FViteError](classes/Z2FViteError.md)
- [Z2FViteErrorLocation](interfaces/Z2FViteErrorLocation.md)
- [formatZ2FViteError](functions/formatZ2FViteError.md)

## Other

### default

Renames and re-exports [z2fVite](functions/z2fVite.md)

## Plugin

- [z2fVite](functions/z2fVite.md)

## Plugin Types

- [PluginOptions](interfaces/PluginOptions.md)
- [VariantConfigs](type-aliases/VariantConfigs.md)
- [Z2FViteConfig](type-aliases/Z2FViteConfig.md)

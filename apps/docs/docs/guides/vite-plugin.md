---
title: Vite Plugin
sidebar_position: 7
description: Generate React form components on the fly from Zod v4 schemas using the @zod-to-form/vite plugin — no committed files, no CLI step.
---

# Vite Plugin

`@zod-to-form/vite` turns Zod schemas into rendered React forms with a single import — no codegen CLI step, no committed generated files. The plugin intercepts a special `?z2f` import suffix at build time, walks the referenced schema, and produces a fully-formed React component as a virtual module.

## When to Use

Use the Vite plugin path when:

- The project is already built with Vite (React, Solid via JSX, etc.)
- You want forms in your source tree to stay automatically in sync with Zod schemas without committing generated files
- HMR-driven development is more important than hand-readable static output
- You'd rather not run a separate `zod-to-form generate` step on every schema change

The plugin coexists with the CLI: a project may commit some generated forms via the CLI and import others through `?z2f`. Each path is independent.

## Prerequisites

- Node.js >= 20
- Zod v4 (`zod@^4.0.0`) — Zod v3 is **not** supported
- A Vite project (`vite@^5 || ^6 || ^7`)
- React 18+ with `react-hook-form` and `@hookform/resolvers`

## Install

```bash
pnpm add -D @zod-to-form/vite
# or npm install --save-dev @zod-to-form/vite
# or yarn add --dev @zod-to-form/vite
```

## Register the plugin

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import z2fVite from '@zod-to-form/vite';

export default defineConfig({
  plugins: [
    z2fVite(),
    react()
  ]
});
```

**Plugin order matters.** Put `z2fVite()` before `react()` so the plugin's generated TSX goes through React's JSX transform normally.

## Add TypeScript declarations

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@zod-to-form/vite/client"]
  }
}
```

That's it — no `.d.ts` files to author yourself.

## Write a schema

```ts
// src/schemas/signup.ts
import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user', 'guest'])
});
```

## Import and render the generated form

```tsx
// src/App.tsx
import { SignupForm } from './schemas/signup.ts?z2f';

export default function App() {
  return (
    <SignupForm
      onSubmit={(data) => {
        // `data` is typed from the schema
        console.log(data);
      }}
    />
  );
}
```

Start the dev server with `pnpm dev`. The form renders immediately — no codegen CLI step, no committed generated files.

### What happened

- Vite saw `import ... from './schemas/signup.ts?z2f'`
- `@zod-to-form/vite` intercepted the import in its `resolveId` hook and generated a virtual module containing a fully-formed React form component for `signupSchema`
- React's JSX transform compiled the generated TSX to JS
- The form rendered

## HMR

Edit a schema file in dev mode and the plugin re-compiles only the affected form:

```ts
// Add a field
export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user', 'guest']),
  age: z.number().int().min(13)  // ← new
});
```

Vite's HMR pushes the new bundle to the browser — `<SignupForm>` re-renders with an additional `age` field, and form state for the existing fields is preserved through React Fast Refresh.

## Variants — multiple forms from one schema

Declare a `z2f.config.ts` in your project root:

```ts
// z2f.config.ts
export default {
  componentName: 'UserForm',
  mode: 'submit',
  ui: 'html',
  variants: {
    edit: { componentName: 'UserEditForm' },
    create: { componentName: 'UserCreateForm', ui: 'shadcn' }
  }
};
```

Then import each variant via `?z2f=<variant>`:

```tsx
import { UserEditForm } from './schemas/user.ts?z2f=edit';
import { UserCreateForm } from './schemas/user.ts?z2f=create';
```

The plugin auto-discovers `z2f.config.{ts,mts,js,mjs}` in the Vite root. When the config file changes, the plugin's HMR hook invalidates every cached form so the next request reflects the new config. A syntax error in the config keeps the previous valid version serving — the dev server stays alive.

## Build for production

```bash
pnpm build
```

The plugin's `load` hook fires during the production build the same way it fires in dev. The generated forms are inlined into the bundle, and there's no runtime dependency on `@zod-to-form/core` or `@zod-to-form/react` for the generated path — bundlers tree-shake those packages out.

## Validation optimization (resolver tree-shake)

When `validationLevel` is set in the plugin config, the build pass strips every `zodResolver(...)` call from `useZodForm` and removes the unused `@hookform/resolvers/zod` import. The optimized bundle is materially smaller:

```ts
// vite.config.ts
import z2fVite from '@zod-to-form/vite';

export default {
  plugins: [
    z2fVite({
      configOverride: {
        validationLevel: 2
      }
    })
  ]
};
```

In dev mode the resolver path stays intact for fast iteration; the strip only fires during `vite build`.

## Rewrite mode (opt-in)

Rewrite mode scans your JSX for `<ZodForm schema={X} />` runtime call sites and rewrites them at build time into the generated component for `X`. You get static codegen with zero source-code changes:

```ts
// vite.config.ts
import z2fVite from '@zod-to-form/vite';

export default {
  plugins: [
    z2fVite({
      rewrite: {} // presence opts in
    })
  ]
};
```

Rewrite mode is **off by default** because it silently changes compiled output. The transform hook only matches `<ZodForm>` JSX whose `schema={...}` prop is an Identifier resolvable to a top-level named import inside the Vite root. Anything dynamic, conditional, aliased, or imported from `node_modules` is left as a runtime call and reported in the build-end summary.

A typical summary at info level:

```
[@zod-to-form/vite] Rewrite mode processed 42 files, rewrote 38 call sites, skipped 4:
  src/App.tsx:22:5 — schema prop is dynamic (JSXExpressionContainer not an Identifier)
  src/Admin.tsx:8:3 — schema identifier resolves to node_modules package '@acme/schemas'
```

See [the rewrite-mode contract](https://github.com/pradeepmouli/zod-to-form/blob/master/specs/007-vite-codegen-plugin/contracts/rewrite-mode.md) for the full match-criteria table.

## Plugin options

| Option | Type | Default | Description |
|---|---|---|---|
| `configPath` | `string` | (auto-discover) | Explicit path to a `z2f.config.{ts,mts,js,mjs}` file |
| `configOverride` | `Partial<Z2FViteConfig>` | `{}` | Shallow override merged on top of the loaded config |
| `rewrite` | `{ include?, exclude? }` | `undefined` | Presence enables rewrite mode; include/exclude are glob patterns |
| `write` | `{ outDir?, filenamePattern? }` | `undefined` | Persist generated files to disk in addition to the virtual modules |
| `logLevel` | `'silent' \| 'warn' \| 'info' \| 'debug'` | `'info'` | Plugin-specific log level |

## Coexistence with the CLI

A project may use both the CLI (committed `*.generated.tsx` files) and the Vite plugin (`?z2f` virtual modules) simultaneously. The plugin only handles imports that carry `?z2f` (or, in rewrite mode, JSX call sites that match the strict `<ZodForm schema={X}>` shape); CLI-emitted files are never touched.

## Troubleshooting

- **`Z2F_VITE_AMBIGUOUS_EXPORT`** — the schema file has multiple Zod schema exports. Set `exportName` in your `z2f.config.ts` (or in a variant) to pick one.
- **`Z2F_VITE_SCHEMA_OUTSIDE_ROOT`** — the resolved schema path is outside your Vite root. Move it into the project, or use the CLI for cross-project schemas.
- **`Z2F_VITE_UNKNOWN_VARIANT`** — you imported `?z2f=foo` but `foo` isn't declared in `config.variants`. Add it, or drop the variant suffix.
- **A specific JSX site isn't being rewritten** — run dev with `logLevel: 'debug'` or build with `logLevel: 'info'` and check the rewrite summary for the per-site reason.

## What's next

- [Component config](./component-config.md) — customizing field-level component overrides
- [Optimization](./optimization.md) — validation level details and bundle impact
- [CLI codegen](./cli.md) — the static-output alternative

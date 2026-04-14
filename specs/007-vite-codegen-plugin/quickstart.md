# Quickstart — `@zod-to-form/vite`

**Branch**: `007-vite-codegen-plugin`
**Audience**: a developer who already has a Vite + React project and wants to generate forms from their Zod schemas with zero CLI friction.
**Time to first rendered form**: under 5 minutes (SC-001).

---

## 1. Install

```bash
pnpm add -D @zod-to-form/vite
# or npm install --save-dev @zod-to-form/vite
# or yarn add --dev @zod-to-form/vite
```

The package pulls `@zod-to-form/codegen` as a dependency automatically. You also need `zod` and `@zod-to-form/react` (the latter provides `ZodForm` types and, in rewrite mode, the runtime entry point).

## 2. Register the plugin

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import z2fVite from '@zod-to-form/vite';

export default defineConfig({
  plugins: [
    z2fVite(),       // default: query-string mode only, rewrite mode OFF
    react(),
  ],
});
```

**Plugin order matters.** Put `z2fVite()` before `react()` so the plugin's generated TSX goes through React's JSX transform normally.

## 3. Add TypeScript declarations for `?z2f` imports

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@zod-to-form/vite/client"]
  }
}
```

That's it — no `.d.ts` files to author yourself.

## 4. Write a schema

```ts
// src/schemas/signup.ts
import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user', 'guest']),
});
```

## 5. Import and render the generated form

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

Start the dev server:

```bash
pnpm dev
```

Open the browser. The form renders immediately — no codegen CLI step, no committed generated files.

### What just happened

- Vite saw `import ... from './schemas/signup.ts?z2f'`.
- `@zod-to-form/vite` intercepted the import in its `resolveId` hook and generated a virtual module containing a fully-formed React form component for `signupSchema`.
- React's JSX transform compiled the generated TSX to JS.
- The form rendered with zero runtime dependency on `@zod-to-form/core` or `@zod-to-form/react`'s runtime renderer.

## 6. Edit the schema and watch HMR

Still in dev mode, open `src/schemas/signup.ts` and add a field:

```ts
export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user', 'guest']),
  acceptTerms: z.boolean(),  // ← new
});
```

Save the file. Within one second (SC-002), the new checkbox appears in your running browser form — no full-page reload, no hand-typed values lost unless the structure change affected them.

## 7. Build for production

```bash
pnpm build
```

Inspect `dist/assets/*.js`: the generated form is inlined in the bundle. No `@zod-to-form/react` or `@zod-to-form/core` code is present.

## 8. (Optional) Enable rewrite mode — "zero-source-change upgrade"

Suppose you already have an app that uses `<ZodForm>`:

```tsx
// src/App.tsx (existing)
import { ZodForm } from '@zod-to-form/react';
import { signupSchema } from './schemas/signup';

export default function App() {
  return <ZodForm schema={signupSchema} onSubmit={(data) => console.log(data)} />;
}
```

You want the production benefits of codegen without rewriting your source. Flip one flag:

```ts
// vite.config.ts
plugins: [
  z2fVite({ rewriteZodForm: true }),
  react(),
],
```

Rebuild. The plugin scans your TSX files, finds the `<ZodForm schema={signupSchema} ...>` call site, confirms `signupSchema` is a statically-resolvable project-local identifier, and replaces the element with a generated component at build time. Your source file on disk is unchanged, but the production bundle no longer contains the runtime renderer for that call site.

Call sites where the schema can't be resolved statically (dynamic schemas, conditional composition, schemas from `node_modules`) are left alone and continue to work via the runtime path — nothing breaks.

## 9. (Optional) Add a config file

Create `z2f.config.ts` at your project root:

```ts
import { defineConfig } from '@zod-to-form/codegen';

export default defineConfig({
  ui: 'shadcn',          // use shadcn/ui components instead of plain HTML
  optimization: {
    level: 2,            // enable L2 native-rules optimization
  },
  variants: {
    edit: {
      componentName: 'UserEditForm',
      // merges on top of defaults when you write ?z2f=edit
    },
  },
});
```

With `optimization.level: 2`, the plugin also strips the `@hookform/resolvers/zod` import from your production bundle (FR-013), saving ~2KB gzipped.

Import a variant via the query:

```tsx
import { UserEditForm } from './schemas/user.ts?z2f=edit';
```

The plugin picks up config changes automatically during dev — edit `z2f.config.ts` and all affected forms regenerate within two seconds.

## 10. (Optional) Persist generated files to disk

```ts
// vite.config.ts
z2fVite({
  write: {
    outDir: 'src/generated',
    // or omit outDir to write beside each schema file
  },
})
```

With `write` set, the plugin still serves virtual modules at dev time but also writes the generated `.tsx` to disk so you can commit them, diff them in code review, or inspect what the plugin produced. Existing `*.generated.tsx` files you wrote or committed yourself are never clobbered (FR-007).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Cannot find module './schemas/signup.ts?z2f'" in IDE | Missing TypeScript declarations | Add `"types": ["@zod-to-form/vite/client"]` to `tsconfig.json` |
| Dev server hangs after saving a schema | Config file has a syntax error | Check the Vite terminal output and the browser overlay — the plugin keeps the last-good config visible until the file is valid |
| Generated form doesn't reflect my config | Plugin can't find `z2f.config.ts` | Pass `configPath: '/absolute/path'` to the plugin options, or move the config to the project root |
| Rewrite mode skipped a `<ZodForm>` call | Schema identifier isn't statically resolvable | Check the DEBUG log output after the build — each skipped site gets a reason line |
| `?z2f=edit` throws `Z2F_VITE_UNKNOWN_VARIANT` | The variant name isn't declared in `config.variants` | Add an entry to `variants` in `z2f.config.ts` or change the query value |

## What's next

- [Plugin options reference](./contracts/plugin-options.md)
- [Query-specifier grammar](./contracts/query-specifier.md)
- [Rewrite-mode rules](./contracts/rewrite-mode.md)
- [Benchmarks — why codegen is faster than runtime](../../apps/docs/docs/guides/benchmarks.md)

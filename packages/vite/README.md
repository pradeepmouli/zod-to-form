# @zod-to-form/vite

Vite plugin for [zod-to-form](https://github.com/pradeepmouli/zod-to-form). Transforms `?z2f` imports into generated form components and (opt-in) rewrites `<ZodForm>` JSX call sites into generated components at build time — all with no separate codegen CLI step.

> **Status**: In active development. See [`specs/007-vite-codegen-plugin/`](../../specs/007-vite-codegen-plugin/) for the full specification, plan, and implementation tasks.

## Quickstart

See the full walkthrough in [quickstart.md](../../specs/007-vite-codegen-plugin/quickstart.md).

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
- **Rewrite mode** (opt-in via `rewrite: {}`): scans source for `<ZodForm schema={X}>` usages and replaces statically resolvable ones with generated components at build time. Unresolvable sites are left alone and fall through to the runtime path. Presence of the `rewrite` object — even empty — enables the mode; pass `rewrite: { include: [...], exclude: [...] }` to constrain which files are scanned.

## License

MIT

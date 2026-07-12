# @zod-to-form/vite

Vite plugin for [zod-to-form](https://github.com/pradeepmouli/zod-to-form). Transforms `?z2f` imports into generated form components and (opt-in) rewrites `<ZodForm>` JSX call sites into generated components at build time — all with no separate codegen CLI step.

## Install

The plugin emits standard React + react-hook-form code, so the consumer
app needs the form runtime even when nothing else imports from
`@zod-to-form/react`:

```bash
pnpm add -D @zod-to-form/vite
pnpm add zod react react-dom react-hook-form @hookform/resolvers
```

`@zod-to-form/vite` is the only build-time dep. The other packages are
runtime peers that the generated form components import.

## Quickstart

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import z2fVite from '@zod-to-form/vite';

export default defineConfig({
  // Plugin order matters: z2fVite BEFORE react() so the generated TSX
  // flows through React's JSX transform normally.
  plugins: [z2fVite(), react()]
});
```

Add the ambient declarations for `?z2f` imports to your `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "types": ["@zod-to-form/vite/client"]
  }
}
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

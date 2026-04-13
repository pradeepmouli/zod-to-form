---
title: Quickstart
sidebar_position: 2
slug: /quickstart
description: Install zod-to-form and render your first Zod-driven form in under a minute, via runtime or CLI codegen.
---

# Quickstart

There are two ways to use zod-to-form. Pick one, or use both — they share the same core walker and produce identical form behavior.

## Path A: Runtime Rendering

Install and render a form in under a minute. Define a Zod schema, pass it to `<ZodForm>`, done.

```bash
pnpm add @zod-to-form/core @zod-to-form/react zod react react-hook-form @hookform/resolvers
```

```tsx
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export function SignupForm() {
  return (
    <ZodForm schema={signupSchema} onSubmit={(data) => console.log(data)}>
      <button type="submit">Sign Up</button>
    </ZodForm>
  );
}
```

`<ZodForm>` reads the schema, infers input types, derives labels, wires `zodResolver` validation, and renders the form — no manual field mapping.

See [Runtime Rendering](./guides/runtime.md) for props, metadata annotations, and custom components.

## Path B: CLI Codegen

Generate a static `.tsx` component at build time. The output reads like hand-written code, imports only `react-hook-form` and your UI library, and has zero runtime dependency on zod-to-form.

```bash
pnpm add -D @zod-to-form/cli zod
```

```typescript
// src/schemas/user.ts
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});
```

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --out src/components/ \
  --name UserForm
```

See [CLI Codegen](./guides/cli.md) for all flags, modes, server actions, and watch mode.

## Next Steps

- [Runtime Rendering](./guides/runtime.md) — full `<ZodForm>` prop reference
- [CLI Codegen](./guides/cli.md) — `zodform generate` flag reference
- [Component Config](./guides/component-config.md) — share a config between runtime and CLI
- [API Reference](./api/index.md) — auto-generated from source

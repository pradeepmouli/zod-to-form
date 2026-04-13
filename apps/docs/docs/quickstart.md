---
title: Quick Start
sidebar_position: 2
description: Two paths — render a Zod schema as a form at runtime, or generate a static .tsx component at build time.
slug: /quickstart
---

# Quick Start

There are two ways to use zod-to-form. Pick one or use both — they share the same core walker and produce identical form behavior.

## Path A: Runtime rendering

Install and render a form in under a minute. Define a Zod schema, pass it to `<ZodForm>`, done.

```bash
pnpm add @zod-to-form/core @zod-to-form/react zod react react-hook-form @hookform/resolvers
```

```tsx
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export function SignupForm() {
  return (
    <ZodForm schema={signupSchema} onSubmit={(data) => save(data)}>
      <button type="submit">Sign Up</button>
    </ZodForm>
  );
}
```

`<ZodForm>` reads the schema, infers input types, derives labels from field names, wires `zodResolver` validation, and renders the form — no manual field mapping. You'll see three inputs (`name`, `email`, `role` as a select) with validation errors surfacing on submit.

## Path B: CLI codegen

Generate a static `.tsx` component at build time. The output reads like hand-written code, imports only `react-hook-form` and your UI library, and has zero runtime dependency on zod-to-form.

```bash
pnpm add -D @zod-to-form/cli zod
```

```bash
npx z2f generate \
  --schema src/schemas/signup.ts \
  --export signupSchema \
  --config z2f.config.ts \
  --out src/components/
```

This produces `src/components/SignupForm.tsx` — inspect it, customize it, commit it. An excerpt:

```tsx
// src/components/SignupForm.tsx (generated)
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { StripIndexSignature } from '@zod-to-form/core';
import { signupSchema } from '../schemas/signup';
import { Input, Select } from '@/components/ui';

type FormData = StripIndexSignature<z.output<typeof signupSchema>>;

export function SignupForm(props: {
  onSubmit: (data: FormData) => void;
  values?: Partial<FormData>;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(signupSchema),
    ...(props.values && { values: props.values }),
  });
  const { register, handleSubmit } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(props.onSubmit)}>
        <div>
          <label htmlFor="name">Name</label>
          <Input id="name" type="text" {...register('name')} />
        </div>
        {/* email, role, submit... */}
      </form>
    </FormProvider>
  );
}
```

No `@zod-to-form/*` imports appear in the output. Regenerate with `--watch` during development.

## When to use which?

| | Runtime `<ZodForm>` | CLI `z2f generate` |
|---|---|---|
| **Best for** | Rapid prototyping, admin panels, CRUD forms | Production forms, design system integration |
| **Output** | React component at runtime | Static `.tsx` file you own |
| **Schema changes** | Instant — form updates on re-render | Regenerate with `--watch` or CI step |
| **Bundle impact** | Includes `@zod-to-form/core` + `react` package | Zero — generated code stands alone |

Both paths accept the same `z2f.config.ts` — you can share component mappings, overrides, and field-level config across runtime and CLI without divergence.

## Next steps

- [Examples](./guides/examples.md) — every feature shown for both runtime and CLI, toggled in-page
- [Runtime Rendering](./guides/runtime.md) — full `<ZodForm>` / `useZodForm` reference
- [CLI Codegen](./guides/cli.md) — `z2f generate` flag reference
- [Core Config](./guides/core-config.md) — `defineConfig` shape and priority rules
- [Component Config](./guides/component-config.md) — share a single config between runtime and CLI

---
title: Examples
sidebar_position: 5
description: End-to-end examples showing runtime rendering, CLI codegen, shared config, and advanced schema patterns.
---

# Examples

Curated end-to-end examples combining a Zod v4 schema with either the runtime `<ZodForm>` or the CLI `zodform generate` pipeline.

## 1. Minimal Runtime Form

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

See [Runtime Rendering](./runtime.md) for the full prop list.

## 2. Static Codegen Output

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --out src/components/ \
  --name UserForm
```

Produces `src/components/UserForm.tsx` with only `react-hook-form`, `@hookform/resolvers`, and the schema as imports. See [CLI Codegen](./cli.md) for the full flag reference.

## 3. Auto-Save Form

```bash
npx zodform generate \
  --schema src/schemas/settings.ts \
  --export settingsSchema \
  --mode auto-save \
  --out src/components/
```

The generated component uses `mode: 'onChange'`, watches value changes, and fires `onValueChange` on every field update — no submit button is rendered.

## 4. Metadata-Driven Field Override (Runtime)

```tsx
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';
import type { FormMeta } from '@zod-to-form/core';

const formRegistry = z.registry<FormMeta>();

const schema = z.object({
  name: z.string().meta({ title: 'Full Name' }),
  bio: z.string().optional(),
});

formRegistry.register(schema.shape.bio, {
  fieldType: 'textarea',
  order: 1,
  gridColumn: 'span 2',
});

export function ProfileForm() {
  return (
    <ZodForm schema={schema} formRegistry={formRegistry} onSubmit={handleSubmit}>
      <button type="submit">Save</button>
    </ZodForm>
  );
}
```

## 5. Shared Component Config (Runtime + CLI Parity)

Define the config once:

```typescript
// src/config/form-components.ts
import { defineComponentConfig } from '@zod-to-form/cli';

export default defineComponentConfig({
  components: '@/components/ui',
  fieldTypes: {
    Input: { component: 'TextInput' },
    Textarea: { component: 'TextareaInput' },
    Select: { component: 'SelectInput' },
  },
  fields: {
    bio: { fieldType: 'Textarea', props: { rows: 6 } },
  },
});
```

Use it at runtime:

```tsx
import { ZodForm } from '@zod-to-form/react';
import { shadcnComponentMap } from '@zod-to-form/react/shadcn';
import componentConfig from '@/config/form-components';

<ZodForm
  schema={userSchema}
  components={shadcnComponentMap}
  componentConfig={componentConfig}
  onSubmit={handleSubmit}
>
  <button type="submit">Save</button>
</ZodForm>
```

Or use the same file with the CLI:

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --ui shadcn \
  --component-config src/config/form-components.ts \
  --out src/components/
```

Both paths produce functionally identical forms. See [Component Config](./component-config.md).

## 6. Full Control with useZodForm

```tsx
import { useZodForm } from '@zod-to-form/react';

function AdvancedForm() {
  const { form, fields } = useZodForm(schema, {
    mode: 'onChange',
    onValueChange: (values) => console.log(values),
  });

  // Full access to RHF: form.watch(), form.setValue(), form.formState, etc.
  return <pre>{JSON.stringify(fields, null, 2)}</pre>;
}
```

## 7. Server Action (Next.js)

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --server-action \
  --out src/components/
```

Produces `UserForm.tsx` and `user-form-action.ts` in the same directory.

## 8. Watch Mode During Development

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --out src/components/ \
  --watch \
  --force
```

Re-emits `UserForm.tsx` every time the schema file changes. Pair with `--force` so the existing file is overwritten on each regeneration.

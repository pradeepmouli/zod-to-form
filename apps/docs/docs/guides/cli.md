---
title: CLI Codegen
sidebar_position: 2
description: Generate static React form components at build time from Zod v4 schemas using the zodform generate CLI.
---

# CLI Codegen

Generate static `.tsx` form components at build time using `@zod-to-form/cli`. This guide covers installation, the `zodform generate` command, generated output structure, component configuration, auto-save mode, server actions, watch mode, and the programmatic API.

## When to Use

Use the CLI codegen path when a project needs static, hand-readable `.tsx` form components generated from Zod v4 schemas at build time. Best suited for production forms, design system integration, and cases where the generated code should be inspected, customized, and committed — with zero runtime dependency on zod-to-form.

## Prerequisites

- Node.js >= 20
- Zod v4 (`zod@^4.0.0`) — Zod v3 is **not** supported
- A Zod schema file with a named export

## Installation

```bash
pnpm add -D @zod-to-form/cli zod
```

The CLI is a dev dependency — it runs at build time, not in production.

## Basic Usage

### 1. Define a Schema File

```typescript
// src/schemas/user.ts
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer']),
  bio: z.string().optional(),
  newsletter: z.boolean().default(false)
});
```

### 2. Generate the Form Component

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --out src/components/ \
  --name UserForm
```

### 3. Generated Output

The generated `src/components/UserForm.tsx` imports only `react-hook-form`, `@hookform/resolvers`, and the schema — no `@zod-to-form/*` imports appear:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userSchema } from '../schemas/user';

type FormData = z.output<typeof userSchema>;

export function UserForm(props: { onSubmit: (data: FormData) => void }) {
  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(userSchema)
  });

  return (
    <form onSubmit={handleSubmit(props.onSubmit)}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" type="text" {...register('name')} />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
      </div>
      <div>
        <label htmlFor="role">Role</label>
        <select id="role" {...register('role')}>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}
```

## CLI Options

### Required Flags

| Flag | Description |
|---|---|
| `--schema <path>` | Path to the TypeScript/JavaScript module containing the Zod schema |
| `--export <name>` | Named export that contains the `z.object(...)` schema |

### Optional Flags

| Flag | Default | Description |
|---|---|---|
| `--out <path>` | `./<Name>Form.tsx` | Output directory or `.tsx` file path |
| `--name <name>` | Derived from `--export` | Component name. If omitted, derived by stripping `Schema` suffix and appending `Form` |
| `--mode <mode>` | `submit` | `submit` — standard `handleSubmit` pattern; `auto-save` — `watch` + `useEffect` pattern |
| `--ui <preset>` | `shadcn` | `shadcn` or `unstyled` |
| `--component-config <path>` | — | Path to component config file (`.json` or `.ts`) |
| `--force` | `false` | Overwrite existing output file |
| `--dry-run` | `false` | Print generated code to stdout without writing files |
| `--server-action` | `false` | Generate a Next.js server action alongside the form |
| `--watch` | `false` | Watch the schema file and regenerate on changes |

## Naming Conventions

| `--export` value | Derived `--name` | Output file |
|---|---|---|
| `userSchema` | `UserForm` | `UserForm.tsx` |
| `orderSchema` | `OrderForm` | `OrderForm.tsx` |
| `loginData` | `LoginDataForm` | `LoginDataForm.tsx` |

Override with `--name`:

```bash
zodform generate --schema src/user.ts --export userSchema --name ProfileEditor
# ProfileEditor.tsx
```

## Generation Modes

### Submit Mode (default)

Generates `handleSubmit` + `onSubmit` prop pattern:

```bash
npx zodform generate --schema src/schemas/user.ts --export userSchema
```

### Auto-Save Mode

Generates `watch` + `useEffect` pattern with `onValueChange` callback and no submit button:

```bash
npx zodform generate --schema src/schemas/user.ts --export userSchema --mode auto-save
```

Output uses `mode: 'onChange'` in `useForm` and fires `onValueChange` on every field update:

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function UserForm(props: {
  onValueChange?: (data: FormData) => void;
  onSubmit?: (data: FormData) => void;
}) {
  const { register, watch } = useForm<FormData>({
    resolver: zodResolver(userSchema),
    mode: 'onChange'
  });

  useEffect(() => {
    const subscription = watch((values) => {
      props.onValueChange?.(values as FormData);
    });
    return () => subscription.unsubscribe();
  }, [watch, props.onValueChange]);

  return <form>{/* fields, no submit button */}</form>;
}
```

### Arrays

When the schema contains `z.array()`, the output includes `useFieldArray`:

```tsx
import { useForm, useFieldArray } from 'react-hook-form';

const { register, handleSubmit, control } = useForm<FormData>({ /* ... */ });
const { fields: itemsFields, append: appendItems, remove: removeItems } = useFieldArray({
  control, name: 'items'
});
```

## Component Configuration

Map field types to custom components using a config file. This same format works with the runtime `<ZodForm>` — see [Component Config](./component-config.md).

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --component-config src/config/form-components.ts \
  --out src/components/
```

The generated file will include static imports from the config's `components` path and apply per-field props:

```tsx
import { TextInput, TextareaInput } from '@/components/ui';

<TextareaInput id="bio" {...register('bio')} rows={6} />
```

## Server Actions

Generate a paired Next.js server action alongside the form:

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --server-action \
  --out src/components/
```

Produces both `UserForm.tsx` and `user-form-action.ts`.

## Watch Mode

Regenerate automatically when the schema file changes:

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --out src/components/ \
  --watch
```

Combine with `--force` to overwrite on each regeneration.

## Programmatic API

### runGenerate(options)

```typescript
import { runGenerate } from '@zod-to-form/cli';

const result = await runGenerate({
  schema: './src/schemas/user.ts',
  export: 'userSchema',
  out: './src/components/',
  name: 'UserForm',
  mode: 'submit',
  ui: 'shadcn',
  force: true,
  serverAction: true
});
```

Returns:

| Property | Type | Description |
|---|---|---|
| `outputPath` | `string` | Absolute path to the generated `.tsx` file |
| `code` | `string` | Generated TypeScript source |
| `wroteFile` | `boolean` | Whether the file was written (false in dry-run or if exists without `--force`) |
| `actionPath` | `string \| undefined` | Path to server action file (when `serverAction: true`) |
| `actionCode` | `string \| undefined` | Server action source |

### createProgram()

Returns a Commander.js `Command` instance for embedding in custom CLIs:

```typescript
import { createProgram } from '@zod-to-form/cli';

const program = createProgram();
await program.parseAsync(['node', 'zodform', 'generate', '--schema', /* ... */]);
```

### defineComponentConfig(config)

Type-safe helper for component config files — see [Component Config](./component-config.md).

### validateComponentConfig(value, source?)

Runtime validation for externally loaded config objects:

```typescript
import { validateComponentConfig } from '@zod-to-form/cli';

const parsed = validateComponentConfig(loadedConfig, 'my-config.json');
```

Throws with descriptive error messages if the config shape is invalid.

## CI Integration

Add to a build script in `package.json`:

```json
{
  "scripts": {
    "generate:forms": "zodform generate --schema src/schemas/user.ts --export userSchema --out src/components/ --force"
  }
}
```

Or add as a pre-build step in CI pipelines to ensure generated forms stay in sync with schema changes.

## Relationship to Runtime

The CLI codegen and runtime `<ZodForm>` share `@zod-to-form/core` — the same walker produces the same `FormField[]` tree. A component config file can drive both paths. See [Runtime Rendering](./runtime.md).

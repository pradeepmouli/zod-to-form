---
name: zod-to-form-cli
description: "This skill should be used when the user asks to generate a form from a Zod schema, use z2f CLI, codegen form component, generate tsx from zod, set up zod-to-form codegen, create a static form from schema, build-time form generation, z2f generate command, CLI form generator, z2f watch mode, z2f server action, controlled components, section grouping, or wants to generate static .tsx form components from Zod v4 schemas using the z2f generate CLI. Covers the generate command, component configuration, controlled components, section grouping, hidden fields, auto-save mode, server actions, watch mode, and the programmatic API."
---

# zod-to-form CLI Codegen Setup

Set up build-time form generation using `@zod-to-form/cli`. This skill covers installation, the `z2f generate` command, generated output structure, component configuration, controlled components, section grouping, hidden fields, auto-save mode, server actions, watch mode, and the programmatic API.

## When to Use

Apply this skill when a project needs static, hand-readable `.tsx` form components generated from Zod v4 schemas at build time. Best suited for production forms, design system integration, and cases where the generated code should be inspected, customized, and committed — with zero runtime dependency on zod-to-form.

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

### 2. Create a Config File

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/ui',
  fieldTypes: {
    Input: { component: 'Input' },
    Textarea: { component: 'Textarea' },
    Select: { component: 'Select' },
    Checkbox: { component: 'Checkbox' }
  }
});
```

### 3. Generate the Form Component

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/ \
  --name UserForm
```

### 4. Generated Output

The generated `src/components/UserForm.tsx` imports only `react-hook-form`, `@hookform/resolvers`, and the schema — no `@zod-to-form/*` imports appear:

```tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { StripIndexSignature } from '@zod-to-form/core';
import { userSchema } from '../schemas/user';

type FormData = StripIndexSignature<z.output<typeof userSchema>>;

export function UserForm(props: {
  onSubmit: (data: FormData) => void;
  values?: Partial<FormData>;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(userSchema),
    ...(props.values && { values: props.values })
  });
  const { register, handleSubmit } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(props.onSubmit)}>
        <div>
          <label htmlFor="name">Name</label>
          <Input id="name" type="text" {...register('name')} />
        </div>
        {/* ... more fields ... */}
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

## CLI Options

Required flags: `--schema <path>` and `--export <name>`. Common optional flags include `--config`, `--out`, `--name`, `--mode` (`submit` | `auto-save`), `--ui` (`shadcn` | `unstyled`), `--force`, `--dry-run`, `--server-action`, and `--watch`. See `references/cli-reference.md` for the complete flags table and naming conventions.

## Generation Modes

### Submit Mode (default)

Generates `handleSubmit` + `onSubmit` prop pattern:

```bash
npx z2f generate --schema src/schemas/user.ts --export userSchema --config z2f.config.ts
```

### Auto-Save Mode

Generates `watch` + `useEffect` pattern with `onValueChange` callback and no submit button:

```bash
npx z2f generate --schema src/schemas/user.ts --export userSchema --config z2f.config.ts --mode auto-save
```

Output uses `mode: 'onChange'` in `useForm` and fires `onValueChange` on every field update.

## Component Configuration

Map field types to custom components using a config file. This same format works with the runtime `<ZodForm>` — see `references/shared-config.md`.

### Define a Config File

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/ui',
  preset: 'shadcn', // merges shadcn defaults into fieldTypes
  fieldTypes: {
    Input: { component: 'TextInput' },
    Textarea: { component: 'TextareaInput' },
    Select: { component: 'SelectInput', controlled: true },
    Checkbox: { component: 'CheckboxInput' }
  },
  fields: {
    bio: { fieldType: 'Textarea', props: { rows: 6 } }
  }
});
```

### Generate with Config

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/
```

The generated file will include static imports from the config's `components` path and apply per-field props:

```tsx
import { TextInput, TextareaInput } from '@/components/ui';
// ...
<TextareaInput id="bio" {...register('bio')} rows={6} />;
```

Resolution priority: per-field override → field type mapping → default rendering. See `references/shared-config.md` for the full config shape, type-safe patterns, and resolution details.

## Controlled Components

When a component doesn't support `ref` forwarding (e.g., custom select, date picker, color picker), mark it as `controlled: true` in the field type config. The CLI generates a `<Controller>` wrapper instead of `register()` spread:

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/ui',
  fieldTypes: {
    Select: { component: 'MySelect', controlled: true },
    DatePicker: {
      component: 'MyDatePicker',
      controlled: true,
      propMap: { onSelect: 'field.onChange' } // remap RHF onChange → onSelect
    }
  }
});
```

Generated output for controlled fields:

```tsx
import { Controller } from 'react-hook-form';

<Controller
  name="role"
  control={control}
  render={({ field }) => (
    <MySelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
  )}
/>
```

With `propMap`, the generated render function remaps RHF field props to your component's API:

```tsx
<Controller
  name="date"
  control={control}
  render={({ field }) => (
    <MyDatePicker value={field.value} onSelect={field.onChange} onBlur={field.onBlur} />
  )}
/>
```

## Hidden Fields

Hide a field from rendering while keeping it in the schema and form state:

```typescript
export default defineConfig({
  components: '@/components/ui',
  fieldTypes: { /* ... */ },
  fields: {
    internalId: { hidden: true }
  }
});
```

Hidden fields are excluded from the generated JSX but remain in the schema's type — useful for computed or server-managed fields.

## Section Grouping

Group multiple fields into a single custom section component:

```typescript
export default defineConfig({
  components: '@/components/ui',
  fieldTypes: { /* ... */ },
  fields: {
    field1: { section: 'MetadataSection' },
    field2: { section: 'MetadataSection' },
    field3: { section: 'MetadataSection' }
  }
});
```

Fields with a `section` value are suppressed from individual rendering. Instead, a single `<MetadataSection fields={['field1', 'field2', 'field3']} />` is emitted after the regular form body. The section component receives a `fields` prop and reads/writes values via `useFormContext()`.

## Per-Schema Overrides

Override field config for specific schemas using the `schemas` key:

```typescript
export default defineConfig({
  components: '@/components/ui',
  fieldTypes: { /* ... */ },
  fields: {
    description: { fieldType: 'Textarea' } // global default
  },
  schemas: {
    userSchema: {
      name: 'UserForm',
      mode: 'auto-save',
      fields: {
        description: { fieldType: 'Input' } // override for this schema only
      }
    }
  }
});
```

Schema-level `fields` are merged over global `fields` — schema wins when keys overlap.

## Server Actions

Generate a paired Next.js server action alongside the form:

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --server-action \
  --out src/components/
```

Produces both `UserForm.tsx` and `user-form-action.ts`.

## Watch Mode

Regenerate automatically when the schema file changes:

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/ \
  --watch
```

Combine with `--force` to overwrite on each regeneration.

## Programmatic API

Embed generation in scripts or build pipelines using `runGenerate(options)` (returns `{ outputPath, code, wroteFile, actionPath, actionCode }`) or `createProgram()` for a Commander.js instance. See `references/cli-reference.md` for the full programmatic API, return types, and `validateConfig()`.

## CI Integration

Add to a build script in `package.json`:

```json
{
  "scripts": {
    "generate:forms": "z2f generate --schema src/schemas/user.ts --export userSchema --config z2f.config.ts --out src/components/ --force"
  }
}
```

Or add as a pre-build step in CI pipelines to ensure generated forms stay in sync with schema changes.

## Relationship to Runtime Rendering

The CLI codegen and runtime `<ZodForm>` share `@zod-to-form/core` — the same walker produces the same `FormField[]` tree. A config file can drive both paths to produce functionally identical forms. See `references/shared-config.md` for details.

## References

- **`references/shared-config.md`** — Shared component config format for CLI + runtime parity
- **`references/cli-reference.md`** — Complete CLI flags and programmatic API

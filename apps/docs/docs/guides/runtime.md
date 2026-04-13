---
title: Runtime Rendering
sidebar_position: 1
description: Render React forms directly from Zod v4 schemas at runtime using the ZodForm component and useZodForm hook.
---

# Runtime Rendering

Render schema-driven React forms at runtime using `@zod-to-form/react`. This guide covers installation, basic and advanced use of the `<ZodForm>` component, metadata annotations, component customization, and the `useZodForm` hook.

## When to Use

Apply the runtime path when a project needs to render React forms directly from Zod v4 schemas — no build step or code generation required. Best suited for rapid prototyping, admin panels, and CRUD forms where schemas change frequently and forms should update instantly.

## Prerequisites

- React 18+ (React 19 supported)
- Zod v4 (`zod@^4.0.0`) — Zod v3 is **not** supported
- TypeScript (recommended, strict mode)

## Installation

```bash
pnpm add @zod-to-form/core @zod-to-form/react zod react react-hook-form @hookform/resolvers
```

Replace `pnpm add` with `npm install` or `yarn add` as appropriate.

## Basic Setup

### 1. Define a Zod Schema

```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'editor', 'viewer']),
  bio: z.string().optional(),
  newsletter: z.boolean().default(false),
});
```

### 2. Render with ZodForm

```tsx
import { ZodForm } from '@zod-to-form/react';

function UserForm() {
  return (
    <ZodForm
      schema={userSchema}
      onSubmit={(data) => console.log(data)} // typed as z.infer<typeof userSchema>
    >
      <button type="submit">Save</button>
    </ZodForm>
  );
}
```

`<ZodForm>` walks the schema, infers input types, derives labels from field names, wires `zodResolver` validation, and renders the form. No manual field mapping is needed.

## ZodForm Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `schema` | `z.ZodObject<...>` | Yes | Top-level Zod object schema |
| `onSubmit` | `(data: z.infer<typeof schema>) => void` | No | Called with parsed data on valid submit |
| `onValueChange` | `(data: z.infer<typeof schema>) => void` | No | Called with parsed data on valid field changes |
| `mode` | `'onSubmit' \| 'onChange' \| 'onBlur'` | No | React Hook Form validation mode (default: `'onSubmit'`) |
| `defaultValues` | `Partial<z.infer<typeof schema>>` | No | Initial form values |
| `components` | `Partial<ComponentMap>` | No | Override the default component map |
| `componentConfig` | `RuntimeComponentConfig` | No | Runtime component mapping with field overrides |
| `formRegistry` | `ZodFormRegistry` | No | Zod v4 registry with `FormMeta` entries |
| `processors` | `Record<string, FormProcessor>` | No | Custom/override processors for schema walking |
| `className` | `string` | No | CSS class applied to the `<form>` element |
| `children` | `ReactNode` | No | Rendered inside the `<form>` (typically submit buttons) |

## Metadata Annotations

Control rendering with Zod v4's native `.meta()` and `z.registry()`:

```typescript
import { z } from 'zod';
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
```

```tsx
<ZodForm schema={schema} formRegistry={formRegistry} onSubmit={handleSubmit}>
  <button type="submit">Save</button>
</ZodForm>
```

`FormMeta` fields: `fieldType`, `order`, `hidden`, `gridColumn`, `props`.

## Custom Components

### Using shadcn/ui

```tsx
import { shadcnComponentMap } from '@zod-to-form/react/shadcn';

<ZodForm schema={schema} components={shadcnComponentMap} onSubmit={handleSubmit}>
  <button type="submit">Save</button>
</ZodForm>
```

### Extending shadcn with Custom Components

Keep shadcn as the base while overriding specific field types. The same config file works with the CLI — see [Component Config](./component-config.md).

```typescript
// src/config/form-components.ts
import { defineComponentConfig } from '@zod-to-form/cli';

export default defineComponentConfig({
  components: '@/components/ui',
  fieldTypes: {
    DatePicker: { component: 'MyDatePicker' },
    Textarea: { component: 'MyRichTextEditor' },
  },
  fields: {
    bio: { fieldType: 'Textarea', props: { rows: 6 } },
  },
});
```

Pass shadcn as the base and the config for overrides:

```tsx
import { shadcnComponentMap } from '@zod-to-form/react/shadcn';
import componentConfig from '@/config/form-components';

<ZodForm
  schema={schema}
  components={shadcnComponentMap}
  componentConfig={componentConfig}
  onSubmit={handleSubmit}
>
  <button type="submit">Save</button>
</ZodForm>
```

Fields matched by the config get custom components; everything else renders with shadcn defaults.

## useZodForm Hook

For full control over the React Hook Form instance:

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

Returns:

| Property | Type | Description |
|---|---|---|
| `form` | `UseFormReturn<z.infer<typeof schema>>` | Full React Hook Form instance |
| `fields` | `FormField[]` | Walked field descriptors from the schema |

## Supported Zod Types

The walker infers these component names from Zod types:

| Zod Type | Component | Notes |
|---|---|---|
| `z.string()` | `Input` | `type` set by format (email, url, etc.) |
| `z.string()` (long) | `Textarea` | When `maxLength > 100` or metadata |
| `z.number()` | `Input` | `type="number"` |
| `z.boolean()` | `Checkbox` | Also `Switch` via metadata |
| `z.date()` | `DatePicker` | `type="date"` |
| `z.file()` | `FileInput` | `type="file"` |
| `z.enum()` | `Select` or `RadioGroup` | RadioGroup when 5 or fewer options |
| `z.object()` | `Fieldset` | Renders children recursively |
| `z.array()` | `ArrayField` | Repeater with add/remove |
| `z.discriminatedUnion()` | `Select` | Reveals variant fields on selection |

## Relationship to CLI Codegen

The runtime renderer and CLI codegen share `@zod-to-form/core` — the same walker produces the same `FormField[]` tree. A component config file can drive both paths. See [CLI Codegen](./cli.md) and [Component Config](./component-config.md).

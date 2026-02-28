<p align="center">
  <img src="https://raw.githubusercontent.com/zod-to-form/zod-to-form/main/attached_assets/logo.png" alt="zod-to-form logo" height="32" />
</p>

# @zod-to-form/react

Runtime React renderer for Zod v4 schemas.

`@zod-to-form/react` integrates `@zod-to-form/core` with React Hook Form and renders schema-driven forms using `ZodForm` and `useZodForm`.

## Installation

```bash
pnpm add @zod-to-form/react @zod-to-form/core zod react react-hook-form @hookform/resolvers
```

## Requirements

- React 18+ (React 19 supported)
- React Hook Form 7+
- Zod v4

## Quick Start

```tsx
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subscribe: z.boolean().default(false)
});

export function UserForm() {
  return (
    <ZodForm
      schema={userSchema}
      mode='onSubmit'
      onSubmit={(data) => {
        console.log('submitted', data);
      }}
    >
      <button type='submit'>Save</button>
    </ZodForm>
  );
}
```

## API

### `ZodForm`

Props:

- `schema`: Zod object schema (required)
- `onSubmit`: submit handler with parsed schema output
- `onValueChange`: called with parsed output on valid field updates
- `mode`: `'onSubmit' | 'onChange' | 'onBlur'`
- `defaultValues`: partial initial values
- `components`: partial override map for default components
- `componentConfig`: runtime component mapping/field overrides
- `formRegistry`: metadata registry from `@zod-to-form/core`
- `processors`: custom/override processors from `@zod-to-form/core`
- `className`: class passed to `<form>`
- `children`: rendered inside the `<form>` (typically actions)

### `useZodForm`

Returns:

- `form`: React Hook Form instance
- `fields`: walked `FormField[]` descriptors from schema

```tsx
import { z } from 'zod';
import { useZodForm } from '@zod-to-form/react';

const schema = z.object({ title: z.string().min(1) });

export function Example() {
  const { form, fields } = useZodForm(schema, {
    mode: 'onChange',
    onValueChange: (values) => {
      console.log(values);
    }
  });

  return <pre>{JSON.stringify({ fieldCount: fields.length, dirty: form.formState.isDirty })}</pre>;
}
```

## Components

### `defaultComponentMap`

Built-in default component map used by `ZodForm`.

### `shadcnComponentMap`

Shadcn-oriented component map export.

## Runtime Component Config

Use `componentConfig` to map field types and specific field paths to custom components at runtime.

```tsx
import { ZodForm } from '@zod-to-form/react';
import type { RuntimeComponentConfig } from '@zod-to-form/react';

const componentConfig: RuntimeComponentConfig = {
  components: '@/components/form-components',
  fieldTypes: {
    Input: { component: 'TextInput' },
    textarea: { component: 'TextareaInput' }
  },
  fields: {
    'profile.bio': {
      fieldType: 'textarea',
      props: { rows: 6 }
    }
  }
};

// <ZodForm schema={schema} componentConfig={componentConfig} />
```

## Accessibility

- Uses native form semantics (`<form>`, labels, fieldsets/legends where applicable)
- Supports error propagation from React Hook Form state into rendered fields
- Includes accessibility-focused integration tests in this package

## Development

From repository root:

```bash
pnpm --filter @zod-to-form/react run build
pnpm --filter @zod-to-form/react run test
pnpm --filter @zod-to-form/react run type-check
```

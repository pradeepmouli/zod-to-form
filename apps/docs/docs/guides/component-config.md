---
title: Runtime Component Config
sidebar_position: 4
description: Runtime-only componentConfig for ZodForm — bind pre-imported React components, apply field overrides, and layer per-component props on top of walker output.
---

# Runtime Component Config

`componentConfig` customizes runtime rendering for `<ZodForm>`. It is **not** the same thing as `defineConfig()` from `@zod-to-form/core`.

- Use `defineConfig()` when you want shared codegen defaults in `z2f.config.ts`
- Use `componentConfig` when you already have React components imported in the browser and want runtime-only overrides

## Config Shape

```ts
type RuntimeComponentConfig = {
  components: {
    source: string;
    overrides?: Record<string, ComponentOverride>;
  };
  componentModule?: Record<string, unknown>;
  fields?: Record<string, FieldConfig>;
};
```

### What each key does

| Key | Purpose |
|---|---|
| `components.source` | Source string kept for parity with codegen docs and diagnostics |
| `components.overrides` | Per-component defaults such as `controlled: true` and default `props` |
| `componentModule` | The imported module object used to resolve component functions by name at runtime |
| `fields` | Per-path field overrides, merged over the walker's inferred output |

## Example

```ts
import type { RuntimeComponentConfig } from '@zod-to-form/react';
import * as formComponents from '@/components/ui';

const componentConfig: RuntimeComponentConfig = {
  components: {
    source: '@/components/ui',
    overrides: {
      ExpressionEditor: {
        controlled: true,
        props: {
          onChange: 'field.onChange',
          value: 'field.value',
        },
      },
    },
  },
  componentModule: formComponents,
  fields: {
    bio: { component: 'Textarea', props: { rows: 6 } },
    'rules[].expression': { component: 'ExpressionEditor' },
  },
};
```

## Using with ZodForm

```tsx
import { ZodForm } from '@zod-to-form/react';
import * as formComponents from '@/components/ui';

<ZodForm
  schema={workflowSchema}
  componentConfig={{
    components: {
      source: '@/components/ui',
      overrides: {
        ExpressionEditor: {
          controlled: true,
          props: {
            onChange: 'field.onChange',
            value: 'field.value',
          },
        },
      },
    },
    componentModule: formComponents,
    fields: {
      'rules[].expression': { component: 'ExpressionEditor' },
    },
  }}
  onSubmit={handleSubmit}
>
  <button type="submit">Save</button>
</ZodForm>
```

Runtime component resolution happens in this order:

1. `fields[path]` override
2. `components.overrides[field.component]`
3. the `components` prop passed to `<ZodForm>` (or built-in defaults)

## Controlled Components

If a custom component does not support the plain `register()` spread, mark it `controlled: true` and use field-expression props:

```ts
components: {
  source: '@/components/ui',
  overrides: {
    Select: {
      controlled: true,
      props: {
        onValueChange: 'field.onChange',
        value: 'field.value',
      },
    },
  },
}
```

Field-expression strings such as `field.onChange`, `field.value`, `field.onBlur`, and `field.ref` are resolved by the runtime when the override is marked controlled.

## Field Overrides

`fields` uses the same path syntax as `defineConfig().fields`:

| Pattern | Matches |
|---|---|
| `name` | Top-level field |
| `address.city` | Nested object field |
| `items[].title` | Field within array items |
| `rules[].expression.body` | Deep nested array/object field |

## How This Relates to `defineConfig()`

For shared config that the CLI and Vite plugin consume, use `defineConfig()` from `@zod-to-form/core`:

```ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },
  fields: {
    bio: { component: 'Textarea', props: { rows: 6 } },
  },
});
```

Use runtime `componentConfig` in addition to that when you need to bind already-imported React components in the browser via `componentModule`.

See also: [Runtime Rendering](./runtime.md), [Core Configuration](./core-config.md), and [CLI Codegen](./cli.md).

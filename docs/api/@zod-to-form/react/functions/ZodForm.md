[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / ZodForm

# Function: ZodForm()

> **ZodForm**\<`TSchema`\>(`props`): `ReactNode`

Defined in: [packages/react/src/ZodForm.tsx:78](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/react/src/ZodForm.tsx#L78)

Runtime React component that renders a type-safe form from a Zod v4 schema.

Walks `schema` to produce `FormField[]`, wires React Hook Form with a
`zodResolver`, and renders each field using the matched component from
`components` (defaults to `defaultComponentMap`). Sections defined in
`componentConfig.fields` are rendered as grouped fieldsets.

## Type Parameters

### TSchema

`TSchema` *extends* `ZodObject`\<`$ZodLooseShape`, `$strip`\>

## Parameters

### props

`ZodFormProps`\<`TSchema`\>

Schema, event handlers, and optional component/config overrides.

## Returns

`ReactNode`

A `<FormProvider>`-wrapped form element.

## Example

```tsx
import { ZodForm } from '@zod-to-form/react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

<ZodForm schema={loginSchema} onSubmit={(data) => console.log(data)} />
```

## Use When

- You want a zero-config form from a Zod v4 schema at runtime, no build step
- You need form rendering in storybook, playgrounds, or low-traffic admin UIs
- You are prototyping before committing to CLI codegen

## Avoid When

- Bundle size is critical — use CLI codegen (`@zod-to-form/cli`) instead for
  production; runtime schema walking adds tree-size overhead
- You need forms for complex schemas with cyclic references — the walker does
  not handle cycles and will hit the max-depth guard silently
- You are on Zod v3 — the schema walker requires Zod v4's `_zod` internals

## Pitfalls

- NEVER pass `componentConfig` without a matching `components` map that covers
  the component names referenced — missing components are silently dropped at
  render time with no console error
- NEVER change the `schema` object identity on every render — `walkSchema` runs
  inside `useMemo` keyed on schema identity, so unstable schema references cause
  full re-walks on each render
- NEVER expect controlled component prop expressions (e.g. `field.value`) to
  work without a `propMap` in `componentConfig` — uncontrolled mode is the
  default; controlled mode requires explicit opt-in via field config

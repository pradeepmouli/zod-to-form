[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / ZodForm

# Function: ZodForm()

> **ZodForm**\<`TSchema`\>(`props`): `ReactNode`

Defined in: [packages/react/src/ZodForm.tsx:73](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/react/src/ZodForm.tsx#L73)

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

- You need form rendering in storybook, playgrounds, or low-traffic admin UIs — where bundle overhead is acceptable and a build step would add friction
- You are prototyping before committing to CLI codegen — `<ZodForm>` and the CLI share the same walkSchema output so the migration is mechanical

## Avoid When

- Bundle size is critical — use CLI codegen (`@zod-to-form/cli`) instead; runtime schema walking includes the full Zod type graph traversal, which does not tree-shake
- You need forms for complex schemas with cyclic references — the walker does not handle cycles and hits the max-depth guard silently with no error

## Never

- NEVER pass `componentConfig` without a matching `components` map that covers
  the component names referenced — missing components are silently dropped at
  render time with no console error; add each name to `components` or use
  `defaultComponentMap` as the base
- NEVER expect controlled component prop expressions (e.g. `field.value`) to
  work without a `propMap` in `componentConfig` — uncontrolled mode is the
  default; add `propMap: { value: 'value', onChange: 'onChange' }` in field
  config to opt in to controlled mode

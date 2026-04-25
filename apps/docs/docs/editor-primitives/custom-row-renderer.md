---
sidebar_position: 5
title: Custom row renderer
description: Register a custom React component to render each row of an array field, with full access to form context.
---

# Custom row renderer

When the default row layout — a single field per row — doesn't fit your form,
register a custom renderer against the array's *item schema*. Your renderer
gets full `useFormContext` access, can read sibling values, and integrates
seamlessly with reorder, ghost rows, and validation.

This pattern uses the existing `FormMeta.render` slot — no new API.

## When to use this

- You need a multi-input row (name + type + cardinality on one line).
- Your row has bespoke affordances (drag handle, override button, type
  navigation link) that the default layout can't express.
- Your row reads sibling form state (e.g. compute a label from another
  field).

If you just need a different *component* per field, use `fields[*].component`
in your config instead — that's lighter than a full renderer.

## Step 1 — Register the renderer

Create a `z.registry<FormMeta>()` and attach a `render` function to your item
schema:

```tsx
import { z } from 'zod';
import type { FormMeta } from '@zod-to-form/core';

const itemSchema = z.object({
  name: z.string(),
  category: z.enum(['fruit', 'vegetable']),
  quantity: z.number().int().min(0)
});

const formRegistry = z.registry<FormMeta>();

formRegistry.add(itemSchema, {
  render: (field) => <ItemRow path={field.key} />
});

const cartSchema = z.object({
  items: z.array(itemSchema)
});
```

The `render` function receives the `FormField` for the array item; the
`field.key` (e.g. `"items.0"`) is the path you'll use to read and write
form state from inside the renderer.

## Step 2 — Implement the row component

Use `useFormContext` to wire each input to RHF, and `useWatch` to react to
sibling values:

```tsx
import { Controller, useFormContext, useWatch } from 'react-hook-form';

function ItemRow({ path }: { path: string }) {
  const { control } = useFormContext();
  const category = useWatch({ control, name: `${path}.category` });

  return (
    <div className="grid grid-cols-[1fr_120px_80px] gap-2 items-center">
      <Controller
        control={control}
        name={`${path}.name`}
        render={({ field }) => (
          <input {...field} placeholder={`Enter ${category} name`} />
        )}
      />
      <Controller
        control={control}
        name={`${path}.category`}
        render={({ field }) => (
          <select {...field}>
            <option value="fruit">Fruit</option>
            <option value="vegetable">Vegetable</option>
          </select>
        )}
      />
      <Controller
        control={control}
        name={`${path}.quantity`}
        render={({ field }) => (
          <input
            {...field}
            type="number"
            value={field.value ?? 0}
            onChange={(e) => field.onChange(Number(e.target.value))}
          />
        )}
      />
    </div>
  );
}
```

Note that the placeholder updates whenever `category` changes — that's the
sibling-watch wiring at work.

## Step 3 — Mount the form

Pass the registry to `<ZodForm>`:

```tsx
import { ZodForm } from '@zod-to-form/react';

<ZodForm
  schema={cartSchema}
  formRegistry={formRegistry}
  onSubmit={(data) => console.log(data)}
/>;
```

The library walks `cartSchema`, finds the array of `itemSchema`, and uses
your registered renderer for every row.

## Composes with other primitives

Custom row renderers compose cleanly with the rest of the editor primitives:

- **Reorder**: set `arrayConfig.reorder: true` and the library renders an
  `ArrayReorderHandle` *next to* your custom row.
- **Ghost rows**: use `arrayConfig.before` / `arrayConfig.after` to
  intersperse non-form rows; your renderer is unaffected.
- **External sync**: `useExternalSync` resets the entire array when the
  source identity changes; your row renderers re-render with the new
  values.

## When the renderer must reach into reorder

If your renderer needs its own drag handle (instead of the default
`ArrayReorderHandle`), receive the index and total via a higher-up
context, or use `useFieldArray` directly inside the parent form and let
the renderer dispatch up. The library does not pass `move` down to the
renderer; that's by design — `move` lives at the array level, not the
row level.

## Common pitfalls

- **Forgetting to memoise heavy renderers**: if your row mounts an
  expensive component (CodeMirror, ReactFlow), wrap it in `React.memo` to
  avoid re-renders on unrelated form changes.
- **Using `useWatch` for the entire form**: subscribing to `''` watches
  every field and re-renders the row on every keystroke. Always pass a
  specific `name`.
- **Re-creating the registry inside a component body**: build it once
  outside the component (or in a `useMemo`) so React doesn't re-mount
  every row on every render.

---
sidebar_position: 2
title: External data sync
description: Keep a form bound to an external source and reset cleanly when the source identity changes.
---

# External data sync

When your form is driven by an external source — a graph node, a
document selection, a server-pushed update — `useExternalSync` resets
the form whenever the source's reference changes, while preserving
in-progress edits when the reference is stable.

## Quickstart

```tsx
import { useExternalSync, useZodForm } from '@zod-to-form/react';

function NodeEditor({ node }: { node: GraphNode }) {
  const { form } = useZodForm(dataTypeSchema, {
    defaultValues: toFormValues(node),
    mode: 'onChange'
  });

  // Reset form when `node` reference changes; preserve edits otherwise.
  useExternalSync(form, node, toFormValues);

  return <ZodForm form={form} schema={dataTypeSchema} />;
}
```

## Reference identity is the contract

The hook compares `source` via `Object.is`. Three rules follow:

1. **Reference change → reset.** Switch from node A to node B and the
   form repopulates with B's projection.
2. **Reference stable → no reset.** Mutate node A's contents in place
   and the form keeps the user's edits. This matches the common editor
   intent: "I'm still editing this node; don't clobber my work."
3. **Round-trip A → B → A** (with three different references) **resets
   twice.** Each transition fires once.

If you want resets on content changes too, swap the reference yourself
(shallow-clone, immutable update):

```tsx
const updatedNode = { ...node, name: newName };
setNode(updatedNode); // reference changed → form resets
```

## Preserving edits across switches

The default discards in-progress edits when the source switches. Pass
`{ keepDirty: true }` to preserve dirty fields:

```tsx
useExternalSync(form, node, toFormValues, { keepDirty: true });
```

Use this for "merge" semantics — useful in collaborative editors where
two users may be touching the same record.

## Projection function

`toValues` is required. Adopters with mismatched source-vs-form shapes
declare the projection inline:

```tsx
function toFormValues(node: GraphNode): FormValues {
  return {
    name: node.data.name ?? '',
    description: node.data.description ?? '',
    members: node.children.map((c) => ({
      name: c.name,
      type: c.type
    }))
  };
}
```

The projection runs only when the identity changes. If it's expensive,
memoise it externally — but for typical editor use cases (~50–100
fields), the per-switch cost is negligible.

## Null sources

The hook calls `toValues(null)` when source is nullish; your projection
decides how to handle that:

```tsx
function toFormValues(node: GraphNode | null): FormValues {
  if (!node) return defaultFormValues;
  return { name: node.data.name, /* ... */ };
}
```

## Common pitfalls

- **Mutating the source in place and expecting a reset**: the hook is
  reference-based. Use immutable updates if you want resets on content
  change.
- **Passing a new object literal every render** (e.g. `useExternalSync(form, { ...node }, toValues)`):
  every render creates a new reference, every render resets the form,
  user edits never stick. Pass the stable reference your state library
  hands you.
- **Forgetting to include the source in `defaultValues` on first
  render**: the hook does NOT call `form.reset` on first render — it
  trusts your `useZodForm({ defaultValues })` to seed the initial
  state.

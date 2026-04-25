---
sidebar_position: 4
title: Ghost rows
description: Render non-form rows alongside form-driven rows — for inherited members, computed defaults, or read-only entries.
---

# Ghost rows

Some array UIs need to display rows that don't belong to form state:
inherited members from a parent schema, computed defaults, or
read-only informational entries. Ghost rows render alongside
form-driven rows but participate in nothing — not state, not
validation, not submission.

## Quickstart

```tsx
import type { GhostRow } from '@zod-to-form/core';

const inheritedAttributes: GhostRow[] = parent.attributes.map((attr) => ({
  id: `inherited-${attr.name}`,
  render: ({ isFirst, isLast }) => (
    <InheritedRow
      attribute={attr}
      isFirst={isFirst}
      isLast={isLast}
      onOverride={() => promoteToLocal(attr)}
    />
  )
}));

const componentConfig = {
  fields: {
    attributes: {
      arrayConfig: {
        before: inheritedAttributes,
        addLabel: '+ Add attribute'
      }
    }
  }
};
```

The form renders inherited rows above the local rows. Each ghost row's
`render` function receives `{ isFirst, isLast }` so you can style group
boundaries (rounded corners, separators, etc.).

## What ghost rows are NOT

Ghost rows are pure render output. They:

- Do **NOT** appear in `useFieldArray.fields`.
- Do **NOT** contribute to `form.formState.errors`.
- Do **NOT** appear in the value submitted via `form.handleSubmit`.
- *Do* remain rendered across a `form.reset` — they live in
  `arrayConfig`, which is outside form state. `reset` clears form-driven
  values; ghost rows are unaffected.

If you need a row to participate in form state, it's not a ghost row —
it's a form row. Append it to the array using `useFieldArray.append()`
and let the library render it normally.

## The "override" pattern

The most common use case: parent schema's members rendered as ghost
rows, with an "Override" button that promotes one to a local form row.

```tsx
function InheritedRow({ attribute, onOverride }) {
  return (
    <div className="opacity-60">
      <span>{attribute.name}: {attribute.type}</span>
      <button onClick={onOverride}>Override</button>
    </div>
  );
}

function promoteToLocal(attr: InheritedAttribute) {
  // 1. Append the inherited values as a local row
  form.append('attributes', { name: attr.name, type: attr.type });
  // 2. Remove the inherited entry from arrayConfig.before
  setInherited((current) => current.filter((c) => c.name !== attr.name));
}
```

The library doesn't orchestrate this — it's application logic. The
ghost-row primitive is a render slot; the override semantics are
yours.

## Position-aware rendering

`render(ctx)` receives `{ isFirst, isLast }` flags relative to the
ghost row's group. Use them for visual separators:

```tsx
const before: GhostRow[] = [
  {
    id: 'g1',
    render: ({ isFirst }) => (
      <div className={isFirst ? 'pt-4 border-t' : ''}>...</div>
    )
  },
  {
    id: 'g2',
    render: ({ isLast }) => (
      <div className={isLast ? 'pb-4 border-b' : ''}>...</div>
    )
  }
];
```

`isFirst` is true only for the first row in `before`; `isLast` is true
only for the last row in `before` (or `after`).

## Reorder interaction

Reordering form-driven rows does **not** move ghost rows. `before`
ghosts stay above all form rows; `after` ghosts stay below. Inside the
form-row block, real rows reorder freely.

## Common pitfalls

- **Reusing ghost-row `id` values across `before` and `after` groups**:
  React's reconciler may misattribute state. Keep IDs unique
  globally.
- **Re-creating the `before` array on every render**: each new
  reference triggers a remount of every ghost row. Memoise:
  ```tsx
  const before = useMemo(() => buildInheritedRows(parent), [parent]);
  ```
- **Putting form state inside `render`**: `useFormContext` works
  because the renderer mounts inside `<FormProvider>`, but ghost rows
  shouldn't have `name` props on inputs that match real form paths —
  edits inside a ghost row will collide with real field values.

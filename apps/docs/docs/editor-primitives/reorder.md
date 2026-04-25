---
sidebar_position: 1
title: Array reorder
description: Let users reorder array rows via a drag handle, keyboard, or any gesture you wire up.
---

# Array reorder

Mark an array as reorderable with one config flag. The library wires
React Hook Form's `move()`, ships a keyboard-operable default handle, and
fires an event you can mirror back to your upstream state.

## Quickstart

```tsx
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const schema = z.object({
  members: z.array(z.string())
});

const componentConfig = {
  fields: {
    members: {
      arrayConfig: {
        reorder: true,
        addLabel: '+ Add member',
        onReorder: (from, to) => {
          console.log(`Reordered: ${from} → ${to}`);
        }
      }
    }
  }
};

<ZodForm schema={schema} componentConfig={componentConfig} />;
```

## What renders

For each row the library mounts a `componentMap.ArrayReorderHandle`
component. The default is a vertical button group:

```
┌──────────────┬───┬──────────┐
│ <input>      │ ↑ │ Remove   │
│              │ ↓ │          │
└──────────────┴───┴──────────┘
```

`↑` is disabled on the first row, `↓` on the last. Both are
keyboard-operable by default.

## Override the handle

Replace `ArrayReorderHandle` in your component map to use any gesture
library:

```tsx
import { defaultComponentMap } from '@zod-to-form/react';
import { useDrag, useDrop } from 'react-dnd';

function DragHandle({ index, total, onMove, disabled }) {
  // your react-dnd, dnd-kit, or framer-motion implementation here
}

const components = {
  ...defaultComponentMap,
  ArrayReorderHandle: DragHandle
};

<ZodForm schema={schema} components={components} />;
```

The library guarantees:

- `index` is the row's current index.
- `total` is the count of form-driven rows (excludes ghost rows).
- `onMove(from, to)` calls RHF's `move()` and then your `onReorder`.
- `disabled` is true when the array hits its `min`/`max` length.

## Accessibility

The default handle includes:

- `role="group"` on the wrapper with an `aria-label` referencing the row.
- Per-button `aria-label`s ("Move row 2 up", "Move row 2 down").
- `disabled` attributes at array boundaries.
- Full keyboard operability via Tab and Space/Enter.

If you replace the default with a drag-based component, **preserve the
keyboard fallback path**. Drag-only reorder excludes keyboard users
and screen-reader users.

## Reorder + ghost rows

Ghost rows (`arrayConfig.before` / `arrayConfig.after`) do **not**
participate in reorder. The handle is per-row on form-driven rows only;
reordering shifts indices among real rows while ghost positions stay
fixed. See [Ghost rows](./ghost-rows.md).

## Common pitfalls

- **Forgetting `arrayConfig.reorder` is false by default**: existing
  forms see no change after a library upgrade. You must opt in per
  array.
- **Not supplying `onReorder`**: the form state updates correctly even
  without it, but if you hold a parallel copy upstream (graph store,
  server cache) you'll fall out of sync. Add the callback the moment
  reorder ships in production.
- **Reorder on fixed-length arrays**: it works. Length constraints
  block add/remove only; reorder works because total length is
  unchanged.

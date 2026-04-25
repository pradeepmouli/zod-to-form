# Contract: Array Reorder

Implemented by:
- `packages/react/src/FieldRenderer.tsx` (`ArrayBlock`) — reads
  `arrayConfig.reorder`, destructures `move` from `useFieldArray`,
  renders `componentMap.ArrayReorderHandle` per row.
- `packages/react/src/components/ArrayReorderHandle.tsx` — HTML default.
- `packages/react/src/shadcn/ArrayReorderHandle.tsx` — shadcn variant.

## Surface

Adopter opts in via `arrayConfig` on the array's `FieldConfig` or via
`FormMeta` on the array schema:

```ts
const config: ZodFormsConfig<typeof Components, typeof Schemas> = {
  // …
  fields: {
    members: {
      arrayConfig: {
        reorder: true,
        addLabel: '+ Add member',
        onReorder: (from, to) => store.reorderMember(from, to)
      }
    }
  }
};
```

## Behaviour

1. `arrayConfig.reorder === true` causes `ArrayBlock` to render an
   `ArrayReorderHandle` for each row, positioned per the adopter's
   `Field` template (same `<div key={item.id}>` wrapper as today).
2. `ArrayReorderHandle` receives `{ index, total, disabled, onMove }`.
   `onMove` is wired to RHF's `useFieldArray.move(from, to)`. The
   library performs the state mutation; the handle component decides
   the gesture (default: ↑/↓ buttons).
3. After `move()` resolves, the library invokes
   `arrayConfig.onReorder?.(from, to)` exactly once on the next
   microtask. The callback receives indices in the *post-reorder*
   array.
4. Ghost rows (`arrayConfig.before`/`arrayConfig.after`) are NOT
   reorderable. Their position in the rendered list is fixed by the
   adopter's array config; only form-driven rows participate in
   `move()`.

## Default off

When `arrayConfig.reorder` is unset or false, `ArrayBlock` renders
exactly as today — no handle, no `move` import effect on bundle if the
component is dead-code-eliminated. This satisfies US1 acceptance
scenario 2.

## Accessibility

- The default `ArrayReorderHandle` is keyboard-operable with
  `aria-label="Move row {index + 1}"` and disabled buttons at array
  boundaries.
- Adopters who replace the handle with a drag-based component MUST
  preserve a keyboard fallback path. Documentation describes the
  pattern and links to WAI-ARIA Authoring Practices for drag-and-drop.

## Edge cases

| Scenario | Behaviour |
|----------|-----------|
| Reorder enabled on fixed-length array (min == max) | Reorder works; add/remove are blocked by length constraints. |
| Reorder fires while `useExternalSync` resets the form | Sync wins (state-of-the-world after the reset). |
| Adopter calls `form.reset` mid-reorder | RHF discards the in-flight move; the reset's array order takes effect. |
| Reorder enabled on an empty array | Handle is not rendered (no rows). |
| Adopter does not register `ArrayReorderHandle` in component map | Library renders the `defaultComponentMap.ArrayReorderHandle` (HTML baseline). |

## Verification

Tests live in `packages/react/tests/ArrayReorder.test.tsx`. Coverage:
- Reorder updates form state ([A,B,C] → [C,A,B] after dragging C up two).
- Reorder fires `onReorder(2, 0)` exactly once.
- `aria-label`s flip when index changes.
- Submit yields the post-reorder order.
- Disabling reorder removes all handle elements.

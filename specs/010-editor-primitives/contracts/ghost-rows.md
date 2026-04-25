# Contract: Ghost Rows

Implemented by `packages/react/src/FieldRenderer.tsx` (`ArrayBlock`)
via the extended `ArrayConfig.before` / `ArrayConfig.after` slots.

## Surface

```ts
const config: ZodFormsConfig<typeof Components, typeof Schemas> = {
  fields: {
    'attributes': {
      arrayConfig: {
        before: inheritedAttributes.map((attr) => ({
          id: `inherited-${attr.name}`,
          render: ({ isFirst, isLast }) => (
            <InheritedAttributeRow
              attribute={attr}
              isFirst={isFirst}
              isLast={isLast}
              onOverride={() => handleOverride(attr)}
            />
          )
        }))
      }
    }
  }
};
```

## Behaviour

1. `arrayConfig.before` and `arrayConfig.after` are arrays of
   `GhostRow` (see `data-model.md`).
2. `ArrayBlock` renders ghost rows in this order:
   - All `before` rows (in array order)
   - All form-driven rows (from `useFieldArray.fields`)
   - All `after` rows (in array order)
3. Each ghost row's `render(ctx)` receives `{ isFirst, isLast }`
   relative to its own group (`before` or `after`), not the overall
   list.
4. Ghost rows are rendered inside the same `<fieldset>` as form rows
   with React keys of the form `ghost-before-${id}` / `ghost-after-${id}`.
   The group prefix means the same `id` may safely appear in both
   `before` and `after` without collision, while a duplicate within a
   single group still triggers the development warning. They
   participate in focus order naturally; styling is the adopter's
   responsibility.

## Form state isolation

- Ghost rows do NOT participate in `useFieldArray.fields` — they are
  not in form state.
- Ghost rows do NOT contribute to `form.formState.errors`.
- Ghost rows do NOT appear in the value submitted via `form.handleSubmit`.
- `form.reset` does NOT clear ghost-row content (they are rendered from
  `arrayConfig`, which lives outside form state).

This satisfies FR-008, US4 acceptance scenarios 1–3, and the
"submit yields only form-driven items" guarantee.

## Reorder interaction

- Ghost rows are NOT reorderable. The reorder handle (if rendered) is
  per-row on form-driven rows only.
- Reordering a form-driven row does NOT change ghost-row positions:
  `before` rows stay above all form rows; `after` rows stay below.
- If an adopter wants ghost rows to "move into" the form (the override
  use case in rune-langium's editor), they call their own
  `useFieldArray.append()` from the ghost-row render output and remove
  the corresponding entry from `arrayConfig.before` on the next render.
  The library does not orchestrate this — it is application logic.

## Edge cases

| Scenario | Behaviour |
|----------|-----------|
| Empty form-driven array, ghost rows present | Ghost rows render; the `<fieldset>` is non-empty. |
| Ghost row `id` collides with another ghost row | One-time development warning; React reconciler may misattribute state. |
| Ghost row `id` collides with a form-driven row's `useFieldArray` `item.id` | No conflict — keys live in separate React contexts (different fragment children). |
| Adopter mutates `arrayConfig.before` between renders | Standard React identity rules apply: stable references survive reconciliation, new references remount. |

## Verification

Tests live in `packages/react/tests/GhostRows.test.tsx`. Coverage:
- N form rows + M ghost rows render N+M total in correct positions.
- `form.handleSubmit` yields only form-driven items.
- Validation errors do not surface for ghost rows.
- Reordering form rows does not move ghost rows.
- `isFirst`/`isLast` flags flip correctly across multiple ghost rows.

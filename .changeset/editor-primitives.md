---
'@zod-to-form/core': minor
'@zod-to-form/react': minor
---

Add editor primitives for graph- and document-driven schema editors:

- **Array reorder** — set `arrayConfig.reorder: true` on an array field to
  enable per-row reorder. The library wires `useFieldArray.move()` and
  mounts a registered `ArrayReorderHandle` per row. Default is a
  keyboard-operable ↑/↓ button group; override via `componentMap`.
  `arrayConfig.onReorder?: (from, to) => void` mirrors changes to your
  upstream state.
- **External-data sync** — `useExternalSync(form, source, toValues, options?)`
  resets a form's values when the `source` reference changes (via
  `Object.is`) and preserves edits while the reference is stable. Pass
  `{ keepDirty: true }` to merge across switches.
- **Discriminator host** — `<ZodFormSwitch source discriminator schemas
  fallback />` picks the right schema from a discriminator field on the
  source and unmounts/remounts via React `key` so no state leaks
  between schemas.
- **Ghost rows** — `arrayConfig.before?: GhostRow[]` and
  `arrayConfig.after?: GhostRow[]` render non-form rows alongside
  form-driven rows. Ghost rows do not participate in form state,
  validation, or submission.
- **Custom row renderer documentation** — formal worked example of the
  existing `FormMeta.render` pattern; new docs under "Editor Primitives"
  in the docs sidebar.

New types in `@zod-to-form/core`: `GhostRow`, `GhostRowContext`. Extended:
`ArrayConfig` (added `reorder`, `onReorder`, `before`, `after`).
New exports in `@zod-to-form/react`: `useExternalSync`,
`UseExternalSyncOptions`, `ZodFormSwitch`, `ZodFormSwitchProps`,
`ArrayReorderHandle` (in both `defaultComponentMap` and
`shadcnComponentMap`).

All new exports are tree-shakeable; an adopter who does not import them
pays no bundle cost.

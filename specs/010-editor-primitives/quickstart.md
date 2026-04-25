# Quickstart — Verify the Editor Primitives

A short verification sequence for the six primitives. Each step is
runnable from a fresh `pnpm install` and is intended to validate one
acceptance criterion or contract.

## Setup

```bash
pnpm install
pnpm --filter @zod-to-form/core build
pnpm --filter @zod-to-form/react build
pnpm --filter @zod-to-form/react test
```

Expected: all existing tests pass, new tests in
`tests/ArrayReorder.test.tsx`, `tests/useExternalSync.test.tsx`,
`tests/ZodFormSwitch.test.tsx`, `tests/GhostRows.test.tsx` pass.
Type-only tests in `packages/core/tests/field-path-types.test.ts`
pass.

## US1 — Array reorder

Open the worked example `apps/docs/docs/editor-primitives/reorder.mdx`
in dev mode:

```bash
pnpm --filter @zod-to-form/docs dev
# → http://localhost:3000/editor-primitives/reorder
```

Expected:
1. The form lists three rows [A, B, C], each with ↑/↓ buttons.
2. Clicking ↑ on row C produces order [A, C, B]; clicking ↑ again
   produces [C, A, B].
3. Submitting yields the post-reorder array.
4. The `onReorder` callback fires once per click with the correct
   `(from, to)` indices (visible in the docs example's "Event log"
   panel).
5. Toggling `arrayConfig.reorder` to `false` removes all handle
   elements and restores today's add/remove-only behaviour.

## US2 — External-data sync

Open `apps/docs/docs/editor-primitives/external-sync.mdx`:

```bash
# Same dev server as above
# → http://localhost:3000/editor-primitives/external-sync
```

Expected:
1. The example shows two source objects (X, Y) and a "Switch source"
   button.
2. Edit a field, then click Switch — the form repopulates with the
   other source's values; the prior edit is discarded.
3. Edit a field, then mutate the same source's *content* (a
   "mutate-in-place" button) — the form keeps the user's edit.
4. The hook fires `form.reset` exactly once per identity change
   (visible in the example's "Reset count" panel).

## US3 — Discriminator host

Open `apps/docs/docs/editor-primitives/discriminator-host.mdx`:

Expected:
1. The example renders a Data form when the source has `$type: "Data"`.
2. Switching the source to `$type: "Choice"` unmounts the Data form
   and mounts the Choice form.
3. Switching to an unmapped discriminator value renders the fallback
   component.
4. Removing the fallback prop and switching to an unmapped value
   renders nothing and emits one console warning.

## US4 — Ghost rows

Open `apps/docs/docs/editor-primitives/ghost-rows.mdx`:

Expected:
1. The form shows three "real" rows and two "ghost" rows above them
   (visually distinct from the real rows).
2. Submitting the form yields only the three real rows.
3. Reordering the real rows does not move the ghost rows.
4. The example's "Override" button on a ghost row demonstrates the
   common pattern: the ghost row disappears and a real row with the
   same data appears in its place.

## US5 — Typed array-index paths

Open `packages/core/tests/field-path-types.test.ts` in your editor.

Expected:
1. Autocompleting after `attributes[].` shows the inner property
   names of the array's element type.
2. Typing a misspelled child property produces a TypeScript error in
   the editor (red squiggle, build-time).
3. Existing configs in `apps/docs/docs/**.mdx` and `examples/**`
   continue to type-check unchanged.

Verify via:

```bash
pnpm --filter @zod-to-form/core type-check
```

Expected: zero errors.

## US6 — Custom row renderer (documentation only)

Open `apps/docs/docs/editor-primitives/custom-row-renderer.mdx`:

Expected:
1. The example registers a custom row renderer against an item
   schema using `FormMeta.render`.
2. The renderer reads sibling form values via `useFormContext` and
   updates them with `form.setValue`.
3. Submitting the form produces the expected array shape.
4. No runtime API change is exercised — the example uses the
   existing `field.render` slot.

## Bundle size budget (FR-012)

```bash
pnpm --filter @zod-to-form/react build
node scripts/bench-report.ts --baseline=v0.7.1 --target=local
```

Expected: an adopter who imports only `<ZodForm>` and
`useZodForm` sees a bundle delta ≤ 200 bytes (gzip) versus the
v0.7.1 baseline.

## Pre-merge gates

```bash
pnpm test
pnpm run type-check
pnpm run lint
```

All MUST pass.

# Phase 0 — Research

## R1: Reorder integration with `useFieldArray`

- **Decision**: Destructure `move` from `useFieldArray` in
  `FieldRenderer.ArrayBlock` and expose it through a new
  `ArrayReorderHandle` component slot in the component map. Reorder is
  off by default; an adopter opts in via `arrayConfig.reorder: true` on
  the `FieldConfig` for the array (or via `FormMeta` on the array
  schema).
- **Rationale**: RHF's `move(from, to)` already preserves per-row state
  and dirty flags. Adopting it directly means zero new state machinery.
  Off-by-default avoids visible churn for existing adopters and satisfies
  US1 acceptance scenario 2 ("no reorder affordance appears" when
  disabled).
- **Alternatives considered**:
  - `swap(a, b)`: simpler API but doesn't match drag-and-drop UX
    (drag *inserts* at position; swap is two-row exchange).
  - Hand-rolled state outside RHF: adds a parallel source of truth and
    breaks `formState.isDirty` semantics.
  - Always-on reorder: would change existing forms' visual surface
    silently. Rejected.

## R2: Reorder gesture surface

- **Decision**: The library ships the *operation* (`move`) plus a
  baseline `ArrayReorderHandle` component. The handle defaults to a
  button group (↑/↓) that calls `move(index, index ± 1)` — fully
  keyboard-operable out of the box. Adopters who want HTML5 drag-and-drop
  or a third-party gesture library override the component in their
  `componentMap`.
- **Rationale**: Constitution IV (zero unnecessary deps) plus
  Constitution VII (a11y by default). A keyboard-first default keeps
  the primitive accessible without bundling `dnd-kit` or similar. US1
  acceptance scenario 3 ("user releases outside any drop target") is
  satisfied trivially by the button-group default and is the adopter's
  responsibility for drag-based overrides.
- **Alternatives considered**:
  - Bundle `dnd-kit`: rejected — adds 30 kB+ and a dep.
  - HTML5 native drag-and-drop default: rejected — clunky a11y story,
    inconsistent across browsers, harder to test.

## R3: Reorder event surface

- **Decision**: `arrayConfig.onReorder?: (from: number, to: number) =>
  void` fires *synchronously* immediately after `move(from, to)`.
  Adopters who hold a parallel copy (graph store, server) mirror the
  change here. The library does not buffer or coalesce events.
- **Rationale**: FR-002 requires emission with source and destination
  indices. RHF's `move()` is synchronous: form state is updated by the
  time `move()` returns, so a synchronous callback observes the
  post-reorder values via `form.getValues()`. A `queueMicrotask` defer
  was considered but adds no semantic value, complicates synchronous
  test assertions, and produces no observable state difference.
- **Alternatives considered**: Event-bus pattern (rejected: too heavy);
  re-using `onValueChange` (rejected: callers can't tell a reorder
  apart from an edit); `queueMicrotask` defer (rejected: no benefit).

## R4: External-data sync

- **Decision**: Ship `useExternalSync(form, source, toValues, options?)`
  in `@zod-to-form/react`. The hook subscribes to `source` reference
  identity and calls `form.reset(toValues(source))` exactly when the
  reference changes. `toValues` is required so adopters with mismatched
  source-vs-form shapes can declare the projection inline (FR-004).
  `options.keepDirty?: boolean` opt-in preserves edits across an
  identity change for adopters who want a "merge" semantic — defaults
  to `false` to match US2 acceptance scenario 3.
- **Rationale**: Identity-based comparison fixes the recurring
  copy-pasted `useEffect(() => form.reset(toValues(data)), [data])`
  bug where shallow content changes trigger spurious resets. The
  documented hook eliminates the variance.
- **Alternatives considered**:
  - Deep-equality compare: too expensive on graph nodes; pushes the
    decision into the hook where adopters can't override it.
  - Wrap inside `useZodForm`: would force every adopter to opt into a
    behaviour many don't need; violates tree-shake budget (FR-012).

## R5: Discriminator host

- **Decision**: `<ZodFormSwitch source={…} discriminator="$type"
  schemas={{ Data: DataSchema, … }} fallback={…} />`. Internally picks
  the matching schema and renders `<ZodForm>` inside a key-stable
  wrapper. When `discriminator` value changes, the host bumps a `key`
  prop on the rendered `<ZodForm>` so React unmounts the previous form
  and mounts a fresh one — this satisfies FR-006 (no residual state
  leaking).
- **Rationale**: Schema-level state isolation via React's `key` is
  cheaper than custom field-tree pruning and matches React's mental
  model.
- **Alternatives considered**:
  - Reuse the same `<ZodForm>` and call `form.reset` on schema change:
    leaves controllers wired to old field paths and produces hard-to-
    reproduce stale-render bugs.
  - Compose at the adopter site (no host): rejected — every editor
    adopter would re-implement the same `switch`. The five-line wrapper
    is the entire value here.

## R6: Discriminator host fallback

- **Decision**: `fallback?: ReactNode | ((source: unknown) => ReactNode)`
  prop. If the discriminator value is missing or unmapped, render
  `fallback` if provided; otherwise render `null` and emit a one-time
  console warning (gated by `_warnedKeys` like the existing
  `sectionComponents` warning).
- **Rationale**: FR-007 explicitly calls for a developer-supplied
  fallback path. Silent `null` matches React's render contract;
  one-time warning prevents log spam in editor apps that swap nodes
  rapidly.

## R7: Ghost rows data shape

- **Decision**: Extend `ArrayConfig` with `before?: GhostRow[]` and
  `after?: GhostRow[]`, where:
  ```ts
  type GhostRow = {
    id: string;                                  // stable key
    render: (ctx: { isFirst: boolean; isLast: boolean }) => ReactNode;
  };
  ```
  Ghost rows render outside `useFieldArray.fields` so they never enter
  form state, validation, or submission (FR-008).
- **Rationale**: A function-valued render avoids the library opining on
  the row's contents. The `id` requirement keeps React reconciliation
  stable across reorders of the *real* rows.
- **Alternatives considered**:
  - Indexed `before`/`after` integers (e.g. `before: 2` → "two ghost
    rows at the top"): too rigid; can't carry adopter-specific data.
  - Single `ghostRows: GhostRow[]` with absolute positions: more
    flexible but harder to reason about; before/after covers the
    inheritance use case (the live consumer's only requirement).

## R8: Field-path type tightening

- **Decision**: Update `DotPath` / `SchemaFieldPath` (in
  `packages/core/src/config.ts`) so when a property's inferred type is
  `T[]`, the path generator emits both `prop` and `prop[].<inner>` keys.
  Existing string fallbacks remain so adopters who use untyped configs
  continue to compile.
- **Rationale**: FR-009 + US5. Today the path syntax `attributes[].x`
  works at runtime via substring matching but doesn't autocomplete.
  Generating both forms in the type union covers both call sites.
- **Alternatives considered**:
  - New `[*]` syntax: would diverge from prior art and require runtime
    parser changes. Rejected.
  - Keep runtime substring matching but don't tighten types: rejected;
    leaves the developer-experience gap that motivated the spec item.
- **Escape hatch**: Adopters who hit a corner case can still type a
  config field key as `string` (the union widens). No breaking change.

## R9: Custom row renderer documentation

- **Decision**: Author one `apps/docs/docs/editor-primitives/custom-row-
  renderer.mdx` page that reuses the existing `FormMeta.render` slot
  with no runtime change. The example registers a custom row against
  an array's item schema, reads sibling values via `useFormContext`,
  and demonstrates how the renderer participates in `useFieldArray`
  reorder.
- **Rationale**: US6 calls for documentation, not new API. The
  `FieldRenderer.tsx` `field.render` branch (line 739–747) already
  handles this; the gap is discoverability.
- **Alternative considered**: Adding a separate `componentMap` slot
  for "custom row" — redundant with `FormMeta.render`.

## R10: Tree-shaking budget

- **Decision**: All four new exports (`useExternalSync`,
  `ZodFormSwitch`, `ArrayReorderHandle` from `defaultComponentMap`,
  `shadcnComponentMap.ArrayReorderHandle`) are top-level named exports
  with no module-init side effects. The `ArrayConfig` type extension
  is type-only.
- **Rationale**: FR-012 caps bundle bloat for non-adopters at ~200
  bytes. Verification step in `quickstart.md` runs `pnpm build` then
  `gzip -c` on a minimal bundle that imports only `<ZodForm>` and
  asserts the size delta is below the budget.
- **Alternative considered**: Subpath exports
  (`@zod-to-form/react/editor-primitives`): rejected — splits the
  public surface unnecessarily; tree-shaking already covers this.

## R11: Test strategy

- **Decision**: Per-primitive `tests/*.test.tsx` files mirroring
  existing patterns in `packages/react/tests`. New shared util in
  `packages/react/tests/setup.ts` for synthesising pointer/keyboard
  reorder events. Type-only tests for US5 use `expectTypeOf` from
  Vitest in a new file alongside `component-config-types.test.ts`.
- **Rationale**: Constitution V (TDD). New tests must fail against
  current `master` before implementation begins.
- **Pre-merge gates**: `pnpm test`, `pnpm run type-check`, `pnpm run
  lint` — same as the rest of the repo.

## Open questions

None. All NEEDS CLARIFICATION resolved.

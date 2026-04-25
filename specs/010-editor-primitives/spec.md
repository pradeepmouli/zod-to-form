# Feature Specification: Editor Primitives for Graph-Driven Schema Editors

**Feature Branch**: `010-editor-primitives`
**Created**: 2026-04-25
**Status**: Draft
**Input**: User description: "Editor primitives for graph-driven schema editors: array reorder slot, external-data sync hook, FormMeta.render documentation, schema-discriminator router, synthetic non-form rows, typed array-index field paths"

## Background

zod-to-form (z2f) is being adopted by editor-style applications that drive a Zod schema from an upstream graph or document model — for example, a visual DSL editor where each node selection swaps which schema is being edited, items can be reordered by drag handle, and rows from the schema's *parent* (inherited members, computed defaults) need to render alongside locally-edited rows.

A live consumer (an adjacent visual-editor package) currently ships ~4,400 lines of bespoke editor code that re-implements form plumbing because z2f does not yet expose the primitives needed for these patterns. This feature closes the gaps so that adoption no longer requires forking or shadowing z2f's internals.

This spec is paired with a separate spec in the consumer repo (`rune-langium/specs/013-z2f-editor-migration`) that covers the migration *consumption* side. The two are independent: this spec ships standalone value to any editor-style adopter; the consumer spec adopts what this spec delivers.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reorder array rows via a drag handle (Priority: P1)

A developer building an editor where each entry in a schema-derived list (e.g. type members, enum values, function inputs) can be reordered by the end user. They expect to wire a drag-handle component into the array UI and have the form state stay in sync without re-implementing array plumbing themselves.

**Why this priority**: This is the single most blocking gap. Without it, every adopter who needs reorder must hand-roll the entire array section — which is exactly what the live consumer did, and exactly what makes z2f adoption feel like "use the validator only, not the renderer."

**Independent Test**: A test app declares an array schema, configures the array's reorder option, drags one row above another using a synthesized pointer event, and asserts (a) the row visually moved, (b) form state reflects the new order, (c) validation still runs against the reordered data, (d) the reordered values round-trip through submit.

**Acceptance Scenarios**:

1. **Given** a form with an array of three items in order [A, B, C] and reorder enabled, **When** the user drags row C above row A, **Then** the array's form state becomes [C, A, B] and submitting yields the same order.
2. **Given** an array with reorder disabled (the default), **When** the rendered form is inspected, **Then** no reorder affordance appears and existing add/remove behavior is unchanged.
3. **Given** a reorder operation in progress, **When** the user releases outside any drop target, **Then** the array order is unchanged and no error is surfaced.

---

### User Story 2 - Reset the form when upstream data changes (Priority: P1)

A developer driving a form from an external source (a graph node, a document selection, a server-pushed update). They expect that when the source identity changes — e.g. the user clicks a different node — the form repopulates with the new source's values without manual ceremony, and without losing in-flight edits when the source object's *contents* change for unrelated reasons.

**Why this priority**: Without this, every adopter writes the same reset effect plus the same set of identity-vs-deep-equality bugs. Shipping it as a documented hook removes a recurring footgun and a copy-paste pattern.

**Independent Test**: A test mounts a form, programmatically swaps the source object reference, and asserts the form's current values reflect the new source. Then mutates an unrelated field of the *same* source object and asserts the form's user-edited value is preserved.

**Acceptance Scenarios**:

1. **Given** a form bound to source object X, **When** the source reference changes to Y, **Then** the form values become the projection of Y.
2. **Given** a form bound to source X with a user edit in progress, **When** an unrelated property of X is updated by reference equality (still X), **Then** the user's in-progress edit is preserved.
3. **Given** a form bound to source X, **When** the source reference changes to Y mid-edit, **Then** the in-progress edit is discarded in favor of Y's values (matches user intent: they switched contexts).

---

### User Story 3 - Pick the right form for a discriminated source (Priority: P2)

A developer whose source object has a discriminator field (e.g. `$type`, `kind`, `category`) and a different schema per discriminator value. They expect to declare a mapping once and have the host pick the right schema and render the right form when the source changes.

**Why this priority**: A documented pattern plus a small wrapper. Adopters can write the wrapper themselves today, but every editor-style adopter writes the same one. P2 because the workaround is a five-line `switch`.

**Independent Test**: A test declares two schemas with a discriminator field, mounts the wrapper with an object whose discriminator is `A`, asserts the A-form rendered. Swaps the object to one with discriminator `B`, asserts the B-form rendered. Asserts swapping back to A re-renders the A-form with the new A-object's values.

**Acceptance Scenarios**:

1. **Given** a discriminator-to-schema map and an object whose discriminator matches an entry, **When** the host renders, **Then** the matching schema's form is shown.
2. **Given** an object whose discriminator does not match any entry, **When** the host renders, **Then** a documented fallback behavior occurs (either an empty render with a warning, or a developer-supplied fallback component).
3. **Given** a discriminator change, **When** the host re-renders, **Then** the new schema's form is shown without leaking values from the previous schema's fields.

---

### User Story 4 - Render rows that aren't in the form data (Priority: P2)

A developer whose array UI needs to display "ghost" rows alongside form-driven rows — for example, inherited members from a parent schema that the user hasn't overridden yet, or read-only computed entries. The ghost rows are drawn the same way as real rows but don't participate in form state and have different action affordances (e.g. an "override" button instead of a "remove" button).

**Why this priority**: This is the highest-leverage feature for editors built on inheritance or composition. P2 (not P1) because the workaround — render the ghost rows in the array's surrounding container instead of inline — is acceptable, just visually awkward.

**Independent Test**: A test declares an array with three real items and configures two ghost rows to render before them. Asserts the rendered list shows five rows total in the right order, that ghost rows do not appear in form state, and that form submission yields only the three real items.

**Acceptance Scenarios**:

1. **Given** an array with N form items and M ghost rows configured, **When** the form renders, **Then** N+M rows appear in the configured order.
2. **Given** ghost rows are present, **When** the form is submitted, **Then** only the form-driven items are in the submitted value.
3. **Given** ghost rows are present, **When** validation runs, **Then** ghost rows do not contribute to validation errors.

---

### User Story 5 - Type-safe array-index paths in config (Priority: P3)

A developer authoring a typed config that targets fields nested inside arrays (e.g. "the type field of every item in the attributes array"). They expect the path string to autocomplete and to error in the editor if they typo a property name.

**Why this priority**: Today the path syntax `attributes[].typeCall.type` works at runtime by substring matching, but the typed config doesn't autocomplete it. Adopters discover the syntax by reading other people's configs. P3 because runtime works; this is a developer-experience polish.

**Independent Test**: A type-only test (no runtime) declares a schema with arrays of objects, types out a path that includes `[]`, and asserts the editor accepts it and rejects a misspelled child property.

**Acceptance Scenarios**:

1. **Given** a schema with `attributes: array of objects { name, type }`, **When** a developer types `attributes[].` in a config field key, **Then** autocomplete offers `name` and `type`.
2. **Given** the same schema, **When** a developer writes `attributes[].typo`, **Then** the type system flags it as an error.
3. **Given** existing configs that use `[]` syntax, **When** the type change ships, **Then** they continue to type-check without modification.

---

### User Story 6 - Adopt a custom render slot for an array item (Priority: P3)

A developer whose array item needs a custom row component (multi-input row, embedded editor, special affordances) but who otherwise wants to stay in the z2f-rendered form. They expect to register the row component against the item schema and have the form host hand it the right context.

**Why this priority**: This is largely already supported via the existing per-schema render slot. P3 because the gap is documentation plus a worked example, not new code. Without a clear example, adopters fall back to writing the entire array section themselves.

**Independent Test**: A test registers a custom row renderer against a schema, mounts a form with an array of that schema, asserts the custom row component renders for each item, and asserts edits inside the custom row update form state correctly.

**Acceptance Scenarios**:

1. **Given** a schema with a custom row renderer registered, **When** the form renders an array of that schema, **Then** the custom renderer is used for each row in place of the default.
2. **Given** a custom row renderer that uses form context to read sibling field values, **When** a sibling field changes, **Then** the row reflects the new sibling value.

---

### Edge Cases

- What happens when reorder is enabled on a fixed-length array (min == max)? Reorder still works; only add/remove are blocked by length constraints.
- What happens when external sync receives a source that doesn't satisfy the schema? The hook resets to the source values as-is (the form will show validation errors); it does not throw.
- What happens when the discriminator host receives an undefined source? Documented fallback (no form rendered, optional warning).
- What happens when ghost rows reference fields that don't exist in the schema? Ghost rows are pure render output; they do not validate against the schema, so this is the developer's responsibility.
- What happens when an in-flight reorder coincides with an external sync? The sync wins (replaces the array entirely with the new source's values).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The form host MUST allow array fields to be marked as reorderable, exposing a reorder operation that updates form state and preserves all per-row state (focus, error, dirty flags) where the row is still present after reordering.
- **FR-002**: The form host MUST emit a reorder event with the source and destination indices when the user reorders an array, so adopters can mirror the change to upstream state if they hold a copy.
- **FR-003**: The library MUST provide a documented hook that resets a form's values when an externally-supplied source object's reference changes, and preserves in-progress edits while the reference is stable.
- **FR-004**: The external-sync hook MUST accept a transform function that projects the source object onto the form's value shape, so adopters with mismatched source-vs-form shapes can declare the mapping inline.
- **FR-005**: The library MUST provide a documented host component that selects between multiple schemas based on a discriminator field on the source, and renders the matching form.
- **FR-006**: The discriminator host MUST clear residual state from the previously-rendered schema when the discriminator changes, so an editor switching from schema A to schema B does not surface A's stale values inside B's form.
- **FR-007**: The discriminator host MUST expose a fallback render path for sources whose discriminator value matches no registered schema, so adopters can show a friendly "unsupported type" surface instead of an empty area.
- **FR-008**: The form host MUST allow an array field to render additional non-form rows (before, after, or interleaved with form-driven rows) at positions chosen by the adopter, where the extra rows do not participate in form state, validation, or submission.
- **FR-009**: The typed configuration surface MUST autocomplete and type-check field paths that traverse arrays via the documented `[]` syntax, including nested paths beneath the array index.
- **FR-010**: The library MUST publish a worked example of registering a custom row renderer for an array item schema, including how the row reads sibling form values via context.
- **FR-011**: All new primitives MUST work without requiring adopters to import from the library's internal subpaths.
- **FR-012**: All new primitives MUST be tree-shakeable: an adopter who does not use reorder, external sync, or the discriminator host MUST NOT pay any bundle-size cost for them.

### Key Entities

- **Reorderable array field**: A form-state-bound array whose item order can change at runtime in response to user gestures, with the change reflected in form state, validation, and submission.
- **External source object**: An adopter-supplied object identified by reference; the form is bound to a projection of it, and reference changes trigger a reset.
- **Schema discriminator map**: A developer-declared map from discriminator field values to Zod schemas, plus an optional fallback.
- **Ghost row**: A renderable item displayed inside an array section that does not participate in form state, validation, or submission.
- **Field path with array traversal**: A dotted path string that may include `[]` to indicate "every item in this array," used to target nested fields for configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An adopter migrating an existing handcrafted array section (~300 lines of code, including reorder, add, remove, validation wiring) to use the new reorder primitive removes at least 60% of the per-section code.
- **SC-002**: An adopter switching from a copy-pasted external-sync effect to the documented hook deletes the corresponding component and replaces it with a single hook call (one line at the call site).
- **SC-003**: For a discriminated source with five branches, an adopter declares the discriminator-to-schema map once and replaces a five-arm conditional rendering five different form components with a single host element.
- **SC-004**: For configs targeting array-nested fields, autocomplete shows nested property names within two keystrokes after the dot following `[]`, and misspellings produce an editor-visible type error.
- **SC-005**: Bundle size for an adopter who uses none of the new primitives increases by no more than the cost of one re-export (≤200 bytes minified+gzip).
- **SC-006**: Documentation includes at least one end-to-end worked example for each new primitive (reorder, external sync, discriminator host, ghost rows, custom row renderer), each runnable from a clean install in under five minutes.
- **SC-007**: An adopter implementing all five priority features in a fresh project completes a working "node-driven schema editor" demo in under one hour, measured from package install to first reorder of a row.

## Assumptions

- Adopters use React and React Hook Form. The primitives do not need to support non-RHF form runtimes.
- Adopters' reorder UX (drag handle, keyboard shortcuts, screen-reader announcements) is a *renderer* concern, not a *primitive* concern. The library exposes the operation; the adopter wires the gesture. Accessibility documentation covers the recommended wiring.
- Ghost rows are a *rendering* feature only. The library does not interpret their data or validate it; adopters render whatever they want in those positions.
- The discriminator host is a *render-time* selector. It does not migrate data when the discriminator changes; switching from schema A to schema B simply unmounts A and mounts B with the new source's values.
- Existing configs that use the `[]` array-traversal syntax continue to work at runtime regardless of whether the typed surface is updated. The type change is additive; no runtime breakage.
- The custom row renderer pattern already works at runtime; the gap is documentation and one example. No runtime API change is required for the User Story 6 outcome.

## Dependencies

- React Hook Form 7+ (already a peer dependency).
- Zod v4 (already a peer dependency).
- No new third-party dependencies. The reorder primitive ships the operation only; gesture libraries are adopter-supplied.

## Out of Scope

- Drag-and-drop gesture libraries: the library does not bundle a drag library, ship pointer event handlers, or prescribe a gesture model.
- Conflict resolution between concurrent external syncs (multi-user, CRDT, OT): out of scope; documented as "last writer wins by reference identity."
- Schema migration when the discriminator changes: out of scope; the host unmounts and remounts.
- Backward compatibility for any previously-removed configuration keys: out of scope.
- Code generation changes: this spec covers runtime primitives only. Codegen-side support for ghost rows or reorder, if needed, is a follow-up.
- Non-React adopters (Vue, Svelte, vanilla): out of scope.

# errorDisplay: 'always' | 'afterTouched' — plan

Stream 1 of the cross-repo schema-as-validity-trigger effort (see
rune-langium `docs/superpowers/specs/2026-07-03-schema-validity-trigger-design.md`).

## Problem

VE forms are live-apply mirrors with no submit boundary — `mode` (RHF's
`onSubmit`/`onChange`/`onBlur`) controls WHEN validation runs, but every
field with an error displays it immediately, including on a freshly created
object nothing has touched yet. Once langium-zod tightens schemas (Stream 2:
min-1 arrays, at-least-one-of refinements), a brand new `Choice` node would
show a wall of errors before the user does anything.

## Decision (already made, see design doc)

Touched-gated error display, not a submit-boundary retrofit. Validation
always runs (formState.errors, isValid, onValueChange metadata keep
reporting everything — node badges need the truth). Only the per-field
`error` string handed to the field template is suppressed until that field
is touched or dirty.

## API surface

- `UseZodFormOptions.errorDisplay?: 'always' | 'afterTouched'` — default
  `'always'` (fully back-compat, no behavior change for existing callers).
- `ZodFormProps.errorDisplay?: 'always' | 'afterTouched'` — forwarded to
  `useZodForm` and threaded down through `FieldRenderer` (same pattern as
  `componentConfig`).
- `ZodFormSwitchProps.errorDisplay?: 'always' | 'afterTouched'` — forwarded
  to the rendered `<ZodForm>` (same pattern as `components`/`componentConfig`).

## Threading (FieldRenderer has no context today for hook options)

`ZodForm` already threads `componentConfig` as an explicit prop through
`FieldRenderer` → `FieldsetBlock` / `ArrayBlock` / `DiscriminatedUnionBlock`
→ recursive `FieldRenderer` calls. `errorDisplay` follows the identical
prop-threading path — no new React Context needed, consistent with existing
plumbing.

## Gating logic

In `FieldRenderer`, `formState.errors` lookup stays as-is (unconditional —
this is what feeds `aria-invalid` too... **decision needed**: does
`aria-invalid` also gate, or only the visible message? Re-reading the design
doc: "error DISPLAY per field is suppressed" — scoped to the human-visible
message/FieldTemplate `error` prop. `aria-invalid` is arguably part of
"display" for assistive tech, but flipping it right when the field becomes
invalid is standard behavior elsewhere (native HTML validation) and the doc
doesn't call it out. Keep `aria-invalid` tied to `errorMessage` truthiness
as before, but gate `errorMessage` itself — so aria-invalid naturally follows
the same suppression. This keeps ONE source of truth (no separate gate for
aria vs text) and satisfies "quiet fresh objects, honest the moment engaged"
for assistive tech too.

Add `isFieldTouchedOrDirty(formState, path)`: reuse the same dotted-path
traversal as `getErrorAtPath` (touched/dirty are keyed identically to
errors — RHF nests them by path segment, terminating in `true` rather than
a `{message}` object) against `formState.touchedFields` OR
`formState.dirtyFields`.

`errorMessage = errorDisplay === 'afterTouched' && !isFieldTouchedOrDirty(...)
  ? undefined : getErrorAtPath(formState.errors, field.key)`

## Array rows

`ArrayBlock` builds `itemField.key = \`${field.key}.${index}\`` — same path
shape RHF uses for `touchedFields`/`dirtyFields` nesting, so the shared
path-walker should resolve per-row touched state correctly. This is the
one part of the design doc flagged as needing explicit verification (RHF's
dirty/touched tracking for array items has known quirks — e.g. whole-array
replace can mark all rows dirty). Verify via a dedicated nested-array test:
touch/type into row 1 only, assert row 0's error stays hidden and row 1's
shows.

## Non-goals

- No change to `mode`, `zodResolver`, `isValid`, or `onValueChange` —
  validation truth is unchanged.
- No new badge/indicator UI.
- CLI codegen output (`packages/cli`) does not call `useZodForm`/
  `FieldRenderer` at runtime — out of scope for this stream.

## TDD plan

1. `useZodForm.test.ts`: default `errorDisplay` is `'always'`; option is
   accepted and doesn't affect `fields`/`schemaError`/`schemaLite`.
2. `FieldRenderer.test.tsx`:
   - `errorDisplay: 'always'` (default, existing tests unchanged) —
     error shows immediately once `formState.errors` has an entry.
   - `errorDisplay: 'afterTouched'` — error hidden pre-touch, appears
     after a change event (dirty) and/or blur (touched).
   - `aria-invalid` follows the same suppression under `'afterTouched'`.
3. `ArrayBlock.test.tsx` (or a new nested-array test in `FieldRenderer.test.tsx`):
   - Two-row array, only row 1 touched → row 0 error hidden, row 1 shown.
4. `ZodForm.test.tsx` / `ZodFormSwitch.test.tsx`: prop forwarding smoke test.

## Release

Trio releases in lockstep per repo convention
(`.changeset/config.json` has empty `fixed`/`linked` — packages version
independently; `@zod-to-form/react` declares an EXACT dep on
`@zod-to-form/core`, so react's changeset needs a version bump even though
core/vite have no code changes here). Add one changeset scoped to
`@zod-to-form/react: minor` (new optional API, back-compat). Check whether
`updateInternalDependencies: patch` requires a companion no-op patch note
for core/vite, or whether react's EXACT pin against an unchanged core
version is fine as-is (react's package.json pins core by exact version
string, not range — a react-only minor bump does NOT need core to also
bump unless the pin is a caret/tilde range requiring resolution).

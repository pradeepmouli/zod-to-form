# Design: z2f → shadcn Adapter Component Set

**Date:** 2026-05-25
**Status:** Approved (design); pending spec review → implementation plan
**Part of:** PR #129 (registry) — held until this lands so the registry ships complete.

## Goal

Let the zod-to-form shadcn registry generate **idiomatic shadcn forms** — `<Checkbox>`, `<Select>`, `<DatePicker>`, etc. — instead of raw HTML inputs. This requires a set of owned adapter components that bridge z2f's field-component contract to the *installed* shadcn `@/components/ui/*` components, shipped as registry source and referenced by the generated config's `components.source`.

## Why this is needed (root cause)

z2f's config has a single `components.source`, but shadcn ships each component in its own file, and z2f's built-in `shadcnComponentMap` is Tailwind-on-plain-HTML *stubs*, not real shadcn adapters. So pointing a starter's config at `@/components/ui/form` (only `Form*` wrappers) means `SHADCN_OVERRIDES`' controlled components (`Checkbox`/`Select`/`Switch`) generate imports against a source that doesn't export them → broken builds. The fix is a real aggregator module that exports those components, with the prop-bridging shadcn requires.

## Scope

**Core set (v1):** Input, Textarea, Checkbox, Switch, Select, RadioGroup, DatePicker.
**Deferred:** Combobox (Popover+Command — heaviest), FileInput (upload handling, rare).

## The adapter module

Source of truth lives in the repo at `apps/docs/registry/components/shadcn/`:
- One small `.tsx` per field type (`input.tsx`, `textarea.tsx`, `checkbox.tsx`, `switch.tsx`, `select.tsx`, `radio-group.tsx`, `date-picker.tsx`).
- `index.tsx` re-exports the named components **and** a `components` map aggregating them.

One module serves all three consumption modes: the React runtime imports the `components` map for `<ZodForm components={…}>`; codegen/vite generate code that imports the named components.

### Adapter contract

z2f passes mapped components either RHF `register`-spread props (uncontrolled: `name`/`onChange`/`onBlur`/`ref`) or `value`/`onChange` (controlled, via `Controller`), plus `options: FormFieldOption[]` for select/radio. The implementation MUST confirm the exact controlled-prop shape by reading how `FieldRenderer` renders controlled components (the `Controller` render path) before wiring each adapter.

| Adapter | shadcn target | bridge |
|---|---|---|
| Input | `@/components/ui/input` | pass-through (`register` spread; forwardRef) |
| Textarea | `@/components/ui/textarea` | pass-through |
| Checkbox | `@/components/ui/checkbox` | `value`(bool) → `checked`; `onChange` → `onCheckedChange` |
| Switch | `@/components/ui/switch` | `value`(bool) → `checked`; `onChange` → `onCheckedChange` |
| Select | `@/components/ui/select` | `options[]` → `<SelectItem>`; `value`/`onValueChange` |
| RadioGroup | `@/components/ui/radio-group` | `options[]` → `<RadioGroupItem>`; `value`/`onValueChange` |
| DatePicker | composed: `@/components/ui/popover` + `calendar` + `button` | `value: Date` / `onChange(Date)`; formatted trigger label |

Controlled adapters (Checkbox/Switch/Select/RadioGroup/DatePicker) are exactly the components `SHADCN_OVERRIDES` marks controlled — so once `source` points at this module, those overrides resolve correctly.

## Shipping & wiring (into the three #129 starters)

- All three items ship the adapter files (target `@components/zod-form/…` — i.e. they land in the consumer's components dir under a `zod-form/` folder).
- The generated `z2f.config.ts` sets `components.source: '@/components/zod-form'` (the aggregator) for **all** items — replacing the current `@/components/ui/form` (codegen/vite) and the stub `zod-form-components` (react).
- React item: `<ZodForm components={components} />` importing the map from `@/components/zod-form`. Drops the old stub-based `zod-form-components.tsx`.
- `registryDependencies` (shared): `input, textarea, checkbox, switch, select, radio-group, label, button, popover, calendar, form`.

## Sample schema change

Add a date field so the DatePicker adapter is actually exercised/demonstrated, e.g.:
```ts
joinedAt: z.date().optional().meta({ title: 'Joined' })
```
(Plus the existing name/email/age/subscribe.) This makes the starter render Input + Checkbox + DatePicker, demonstrating the adapter set end-to-end.

## Testing

- **Adapter unit/render tests** (existing react test setup, jsdom): each adapter renders and bridges value↔onChange correctly (e.g. toggling Checkbox calls onChange with a boolean; selecting a Select option calls onChange with the value; DatePicker selecting a day calls onChange with a Date).
- **Typecheck**: adapter source compiles under strict TS.
- **Registry**: `registry:build` regenerates; conformance (AJV) + `registry:check` stay green. The codegen item's generated form now imports `Checkbox`/`DatePicker` from `@/components/zod-form` (not raw inputs / wrong source).
- **Generated-output assertions**: a test that the codegen output for the sample schema imports the expected adapters from the configured source.

## Integration / sequencing

- This work lands on the `feat/shadcn-registry` branch (PR #129), which stays held until the adapter set is complete — so the registry ships idiomatic out of the box.
- Depends on the merged form-value coercion fix (already on master): number/date coercion via `setValueAs` is in place, so the DatePicker's `Date` values + the date field validate correctly.

## Open questions / risks

- **Exact controlled-prop names**: confirm against `FieldRenderer`'s `Controller` render path before wiring adapters (don't assume `value`/`onChange`).
- **DatePicker date↔string**: the Calendar yields a `Date`; ensure the schema (`z.date()`) + the merged `setValueAs` (`valueAs`/`new Date`) round-trip cleanly. Verify in the smoke test.
- **shadcn component availability**: `calendar`/`popover` pull `date-fns` + `react-day-picker` transitively via shadcn's own deps — confirm they're covered by the `registryDependencies` (shadcn installs them when adding `calendar`).

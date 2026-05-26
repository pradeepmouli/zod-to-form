# Design: genuinely-owned codegen output, shadcn **Base UI** target (zero runtime z2f dependency)

**Date:** 2026-05-26
**Status:** Draft (design); supersedes the Radix-targeted spec (`2026-05-26-codegen-owned-output-design.md`)

> This revises the approved Radix-based design by changing **one foundational decision**: the shadcn registry now targets shadcn's **Base UI** component set (`ui.shadcn.com/docs/components/base/*`), not the legacy Radix set (`/radix/*`). All other decisions (ownership target, ejected layout, `StripIndexSignature` opt-in, date route-by-type, docs accuracy, Plan A/B decomposition) carry forward unchanged. The motivating hope — "Base UI Select is options-native, so the `Select`/`RadioGroup` adapters disappear" — **does not hold** after verification (see §1–§2 and Risks); the practical Base UI win is elsewhere (Checkbox/Switch coercion simplifies, no `boolean | 'indeterminate'` normalization). This spec records what is actually true against Base UI 1.5.x + shadcn's Base UI registry.

## Goal

Make z2f's central marketing claim — *"eject to generated code you fully own; no runtime dependency on any `@zod-to-form` package; stop using zod-to-form entirely and the generated code keeps working"* — **literally true** for the codegen path; minimize the z2f-authored adapter layer in the shadcn registry; and clean up the ejected file layout so it reads as "your code + a clearly-labelled z2f integration layer."

Intertwined problems, one cohesive fix:
1. **Dependency leak.** The generated form file is already z2f-free, but the adapters it imports are not: `select.tsx` and `radio-group.tsx` both `import type { FormFieldOption } from '@zod-to-form/core'`, and the starters declare `@zod-to-form/core` as a `devDependency`. A form with a Select/RadioGroup field transitively pulls `@zod-to-form/core` into "owned" code.
2. **Adapter bloat.** Of the seven shipped adapters, four (`Input`, `Textarea`, `Checkbox`, `Switch`) carry little or no logic codegen bindings can't express, and `DatePicker`'s logic exists only because z2f forces both `z.date()` and string-date schemas through one hand-rolled Date picker. `Select`/`RadioGroup` (options iteration) remain irreducible **on Base UI too** (see §2).
3. **Layout / naming.** The example form (`zod-form.tsx`) shadows the adapter directory (`zod-form/`), breaking imports; the sample schema and config are stuffed into a `zod-form/` namespace that blurs "z2f's integration layer" with "your domain code"; and `z2f.config.ts` is buried under `@lib/` instead of the project root where the tooling auto-discovers it.

## Naming principle

Two categories, named on purpose:
- **z2f's integration layer → `z2f`-branded:** `z2f.config.ts` (project root), `@/components/z2f/` (adapters). Signals "this came from z2f."
- **Your domain code → neutral, `example-` for samples:** `@/lib/example-schema.ts`, `@/components/example-form.tsx`. Signals "this is yours — rename, move, replace freely."

## Target ejected layout

```
z2f.config.ts                       ← project ROOT (auto-discovered by CLI + Vite plugin)
src/
  lib/
    example-schema.ts               ← sample Zod schema (YOURS; neutral name)
  components/
    z2f/                            ← z2f adapter layer
      index.tsx                     ← barrel: re-exports ui/* + composites + StripIndexSignature type
      types.ts                      ← ControlledFieldProps, FormFieldOption, StripIndexSignature (all owned, zero z2f)
      select.tsx, radio-group.tsx   ← composite adapters (options iteration — irreducible on Base UI too)
    example-form.tsx                ← sample runtime <ZodForm> usage (YOURS; neutral name)
    ui/*                            ← shadcn Base UI primitives (from shadcn's own registry, base style)
```

Generated form imports: `react-hook-form`, `zod`, `@hookform/resolvers`, `@/lib/example-schema`, `@/components/z2f`, and (for date fields) native inputs or `@/components/ui/*`. **Zero `@zod-to-form/*`.**

## Background: Base UI vs. Radix — what changed and what didn't

shadcn now ships two component sets: legacy Radix (`/docs/components/radix/*`, `asChild`) and **Base UI** (`/docs/components/base/*`, `render` prop). `npx shadcn create` lets the user pick; new docs for the full Base UI set landed Jan 2026 (changelog `2026-01-base-ui`), and Base UI itself is at 1.5.x with a published, versioned API reference. Base UI is from the MUI team; Radix has slowed since the WorkOS acquisition. shadcn's official position is gradual, component-by-component migration — both sets remain supported. (Sources at the end of this section.)

The brainstorm's premise was that Base UI's `Select`/`Combobox` are *options-native* (take an `items` array of `{value,label}` and render the list internally), which would let codegen emit a flat `<Select items={field.options} .../>` and **delete the Select/RadioGroup adapters**. Verification against the real APIs disproves the "render internally" half:

- **Base UI `Select.Root` `items`** exists, but its documented purpose is **label lookup** for `<Select.Value>` (and object-value→string conversion) — *not* auto-rendering the popup. You **still compose `<Select.Item>` children**, typically by mapping the same `items` array inside `<Select.List>`. shadcn's Base UI Select example confirms this: it declares `const items = [{label,value}, …]` then `{items.map((item) => <SelectItem .../>)}` inside `<SelectContent>`. ([base-ui.com/react/components/select](https://base-ui.com/react/components/select), [ui.shadcn.com/docs/components/base/select](https://ui.shadcn.com/docs/components/base/select))
- **Base UI `RadioGroup`** has **no `items` prop** — you compose one `<Radio.Root>` per option (wrapped in a `<label>`). shadcn's Base UI radio-group example maps options to `<RadioGroupItem>` + `<Label>` manually. ([base-ui.com/react/components/radio](https://base-ui.com/react/components/radio), [ui.shadcn.com/docs/components/base/radio-group](https://ui.shadcn.com/docs/components/base/radio-group))

So **option iteration is still irreducible** — a flat codegen prop-binding cannot emit `options.map(...)`. The Select/RadioGroup adapters survive. The genuine Base UI improvements over Radix for this work are:

- **Checkbox/Switch** controlled callbacks are `onCheckedChange(checked: boolean, eventDetails)` — the first argument is a **plain `boolean`**, never `boolean | 'indeterminate'`. (Indeterminate is a separate `indeterminate` prop, not a value the callback emits.) This removes the Radix-era `c === true` normalization entirely, and makes `onCheckedChange={field.onChange}` bind directly. ([base-ui.com/react/components/checkbox](https://base-ui.com/react/components/checkbox), [base-ui.com/react/components/switch](https://base-ui.com/react/components/switch))
- All Base UI value callbacks pass `(value, eventDetails)` with **value first**. RHF's `field.onChange` reads `argument[0]` as the value and ignores the rest, so `onCheckedChange={field.onChange}` / `onValueChange={field.onChange}` bind cleanly with no wrapper closure. ([react-hook-form.com/docs/usecontroller/controller](https://react-hook-form.com/docs/usecontroller/controller))
- Base UI Checkbox/Switch use `inputRef` (not the root `ref`) to reach the hidden `<input>`, and accept `name`/`id` on the root.

The runtime `shadcnComponentMap` (`packages/react/src/shadcn/index.ts`) is a **separate** implementation — native HTML stubs with shadcn class names, uncontrolled, works without shadcn installed. It is out of scope here; this design touches only the codegen/registry path. (Its own `import { FormFieldOption } from '@zod-to-form/core'` is fine — library-internal, not user-owned.)

## Architecture

### 1. Per-field-type binding against the shadcn Base UI primitives

For each field type: the Base UI prop API, whether a z2f adapter is needed, and the codegen binding.

| Field type | Base UI / shadcn-base primitive | Controlled API | z2f adapter? | Codegen binding |
| --- | --- | --- | --- | --- |
| string / number / email | `Input` (`@/components/ui/input`) | native input, ref-forwarding | **No** | uncontrolled `register` against re-exported `Input` |
| long string | `Textarea` (`@/components/ui/textarea`) | native textarea | **No** | uncontrolled `register` against re-exported `Textarea` |
| boolean → checkbox | `Checkbox` (`@/components/ui/checkbox`, wraps Base UI `Checkbox.Root`) | `checked: boolean`, `onCheckedChange(checked, details)` | **No** | `<Checkbox checked={!!field.value} onCheckedChange={field.onChange} … />` (flat) |
| boolean → switch | `Switch` (`@/components/ui/switch`, wraps Base UI `Switch.Root`) | `checked: boolean`, `onCheckedChange(checked, details)` | **No** | `<Switch checked={!!field.value} onCheckedChange={field.onChange} … />` (flat) |
| enum → select | `Select`* (composed `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`) | `value`, `onValueChange(value, details)`; `items` for label lookup only | **YES** | `<Select options={field.options} value=… onChange=… …/>` → adapter iterates |
| enum → radio | `RadioGroup`* (`RadioGroup` + `RadioGroupItem` + `Label` per option) | `value`, `onValueChange(value, details)`; no `items` | **YES** | `<RadioGroup options={field.options} value=… onChange=… …/>` → adapter iterates |
| `z.string().date()/.time()/.datetime()` | native `<input type="date\|time\|datetime-local">` | native input | **No** | uncontrolled `register` (Tier-1, see §4) |
| `z.date()` | shadcn Base UI `date-picker` (Popover + Calendar) | Calendar `selected`/`onSelect` (Date) — self-stateful example | **YES** (thin, Date-only) | controlled `value`/`onChange` over the wrapper (see §4) |

*Select/RadioGroup require children composition → cannot be a flat codegen binding → adapter stays.

**Controlled binding mechanics (Base UI specifics):**
- `checked={!!field.value}` — `undefined → false` guards React's controlled/uncontrolled warning when a boolean field has no default. Base UI's `checked` is `boolean | undefined`; `!!field.value` keeps it a strict boolean.
- `onCheckedChange={field.onChange}` — Base UI passes `(checked: boolean, eventDetails)`; RHF takes arg[0]. **No `=== true` normalization needed** (unlike Radix), because Base UI never emits `'indeterminate'` through this callback.
- `ref={field.ref}` on `Input`/`Textarea` reaches the native element (uncontrolled register path). For Checkbox/Switch, codegen does **not** thread `field.ref` to the root `ref` (Base UI's root ref is the styled element, not the focusable input — `inputRef` is the hidden input). RHF controlled fields do not require a ref for value tracking; the field still validates and submits. (Open item below.)

### 2. Does Base UI eliminate the `Select`/`RadioGroup` adapters? — **No.**

Verified above: neither Base UI Select nor RadioGroup renders the option list from a prop; both require composed children. Codegen emits flat prop bindings and cannot emit `options.map(...)`. Therefore:

- **`Select` adapter — KEPT.** Iterates `options` into `<SelectItem>` children inside `<SelectContent>`; maps the RHF `value`/`onChange` shape to Base UI's `value`/`onValueChange` and stringifies values for the trigger.
- **`RadioGroup` adapter — KEPT.** Iterates `options` into `<RadioGroupItem>` + `<Label>` pairs; maps `value`/`onChange` to `value`/`onValueChange`.

**Definitive end state:** the z2f-authored adapter layer is **`select.tsx` + `radio-group.tsx`** (plus the optional thin `date-picker.tsx` from §4) — *not* zero. `Input`/`Textarea`/`Checkbox`/`Switch` adapter files are **deleted** (bound flat to re-exported `ui/*`). The `types.ts` module stays. This is the same adapter count as the Radix design; Base UI does not reduce it. The Base UI win is logic-shrinkage inside the surviving Checkbox/Switch *bindings* (no normalization), not file count.

The barrel `@/components/z2f/index.tsx` becomes a thin aggregator:

```tsx
// Re-export raw shadcn Base UI primitives (register-/controlled-compatible as-is)
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Checkbox } from '@/components/ui/checkbox';
export { Switch } from '@/components/ui/switch';
// Composite adapters (kept — options iteration is irreducible on Base UI too)
export { Select } from './select';
export { RadioGroup } from './radio-group';
// shadcn Form* layout wrappers (unchanged)
export { FormItem, FormControl, FormLabel, FormMessage, FormDescription, FormField } from '@/components/ui/form';
// Owned form-data type utility (see §5)
export type { StripIndexSignature } from './types';
```

- **Delete** adapter files: `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `switch.tsx` (and `date-picker.tsx` per §4 unless the thin wrapper is required).
- **Keep** adapter files: `select.tsx`, `radio-group.tsx`.

### 3. `FormFieldOption` vs Base UI's item shape — sever the runtime z2f dependency

Base UI's `Select.Root` `items` accept `{ label: React.ReactNode; value: any }[]` (also a `Record<string, ReactNode>` map and grouped arrays). z2f's `FormFieldOption` is `{ value: string | number; label: string; disabled?: boolean }`. The shapes are **compatible** for the `{value,label}` case — but the surviving `Select`/`RadioGroup` adapters still consume `FormFieldOption` (they receive `options` from z2f's field binding and iterate). So the "inline `FormFieldOption` to sever the core dep" step from the Radix design **is still required** — it is not made moot by Base UI, because adapters (not Base UI) own the iteration and reference the type.

Inline `FormFieldOption` into the already-owned `@/components/z2f/types.ts` (a flat 3-field interface, no transitive z2f types). Drop the `@zod-to-form/core` import from `select.tsx`/`radio-group.tsx`.

**Result:** every owned **runtime** file (generated form, `select.tsx`, `radio-group.tsx`, `ui/*`, `types.ts`) carries **zero `@zod-to-form/*` imports**. The only remaining z2f touchpoint is `z2f.config.ts` (`import { defineConfig } from '@zod-to-form/core'`), which is **build-time tooling**: needed only to re-generate. On a full eject (delete the config, uninstall core) the generated form still compiles and runs. The "no *runtime* dependency / keeps working without z2f" claim becomes literally true.

### 4. Coercion the binding still needs — and what Base UI removes

With the `Checkbox`/`Switch` adapters gone, codegen binds the re-exported `ui/*` Base UI components directly:

```tsx
<Controller name={"subscribe"} control={control} render={({ field }) => (
  <Checkbox checked={!!field.value} onCheckedChange={field.onChange}
            id="subscribe" name={field.name} onBlur={field.onBlur} />
)} />
```

This requires the codegen field-expression resolver to recognize the `!!field.value` coercion form. Today `RHF_FIELD_EXPRESSIONS` (`packages/codegen/src/generate.ts:59`) is an allowlist of exact strings (`'field.value'` → emitted as `{field.value}`). Add `'!!field.value'` → emitted as `{!!field.value}`. The resolver wraps recognized strings in `{…}`, so this is an allowlist + emit extension, consumed by codegen.

- **`!!field.value` coercion — STILL NEEDED.** Base UI's `checked` is `boolean | undefined`; an undefined RHF value (boolean field with no default) would flip the control uncontrolled→controlled. `!!field.value` is the guard. Unchanged from the Radix design.
- **`=== true` / `boolean | 'indeterminate'` normalization — NO LONGER NEEDED.** Base UI's `onCheckedChange` first arg is a plain `boolean`. `onCheckedChange={field.onChange}` is correct as-is; no `(c) => field.onChange(c === true)` closure. This is the concrete Base UI simplification.

### 5. DatePicker: route by schema type (native inputs + shadcn Base UI date-picker dep)

Unchanged in shape from the Radix design; re-derived against Base UI:

- **`z.string().date()` / `.time()` / `.datetime()`** (ISO-string-valued) → native `<input type="date" | "time" | "datetime-local">`. String-valued, `register`-compatible, **Tier-1 (no adapter, no conversion)**. Fixes the current "time precision lost" limitation (native `time`/`datetime-local` carry time).
- **`z.date()`** (JS `Date` object) → shadcn's installable **Base UI** `date-picker` (Popover + Calendar), pulled as a `registryDependency`. Bound controlled via `value`/`onChange` (Date-native — no string conversion).

**Core walker change.** Today the string processor (`packages/core/src/processors/string.ts`) routes all date-ish formats to `component: 'DatePicker'` (`DATE_PICKER_FORMATS`, line 16; `field.component` set line 64) and sets `field.type` from `FORMAT_TYPE_MAP` (`date`/`time`/`datetime-local`, lines 8–12). Change it so string date/time/datetime formats keep `component: 'Input'` and carry the native `type` (`'date'`/`'time'`/`'datetime-local'`); reserve `DatePicker` for the `z.date()` (Date-object) processor.

**Base UI date-picker shape (verified).** shadcn's Base UI `date-picker` ships as a **self-stateful example** — `const [date, setDate] = React.useState<Date>()`, with `<Calendar mode="single" selected={date} onSelect={setDate} />` inside a Popover ([ui.shadcn.com/docs/components/base/date-picker](https://ui.shadcn.com/docs/components/base/date-picker)). It is **not** a controlled `value`/`onChange` component. Therefore the `z.date()` path needs a **thin Date-only controlled wrapper** `@/components/z2f/date-picker.tsx` that exposes `value`/`onChange` over the shadcn composition (Popover + Calendar), passing `selected={field.value} onSelect={field.onChange}` — **zero string parsing** (Date in, Date out). This is a fraction of today's adapter and still zero-z2f. `date-fns` (or the shadcn Calendar's own formatter) is retained only for trigger-label formatting in this wrapper; string-date fields need no date library.

Net: the parsing-heavy `DatePicker` adapter is removed; z2f-authored adapters are `Select` + `RadioGroup` + the thin Date-only `date-picker` wrapper.

### 6. Move `StripIndexSignature` to an owned shared module (opt-in)

Unchanged from the Radix design. `generateFormComponent` inlines a ~18-line `StripIndexSignature<T>` block into every generated form (`packages/codegen/src/templates.ts`). Add an optional codegen config knob `typesModule?: string` (an import specifier):

- **When set:** codegen emits `import type { StripIndexSignature } from '<typesModule>'` instead of inlining. `FormData`/`FormOutput` reference the imported utility.
- **When absent (default):** inline as today — preserving self-contained single-file output for standalone `npx zodform generate` users.

The registry starters set `typesModule: '@/components/z2f'` (the barrel), so the starter form imports `StripIndexSignature` from the **same** module it imports components from — one owned import surface, zero `@zod-to-form/*`. `StripIndexSignature` is added to `@/components/z2f/types.ts` alongside `ControlledFieldProps` and `FormFieldOption`.

### 7. Relayout the ejected files (folder rename + root config + neutral sample names)

Unchanged from the Radix design. The current layout has the example form (`@components/zod-form.tsx`) shadowing the adapter directory (`@components/zod-form/`), so `import { components } from '@/components/zod-form'` resolves to the file (no `components` export) instead of the barrel. The relayout fixes this and applies the naming principle. In `apps/docs/registry/build/items.ts` (and the adapter source dir), update every file's `path`/`target`:

| concern | old target | new target |
| --- | --- | --- |
| adapter barrel | `@components/zod-form/index.tsx` | `@components/z2f/index.tsx` |
| adapter types | `@components/zod-form/types.ts` | `@components/z2f/types.ts` |
| composite adapters | `@components/zod-form/{select,radio-group}.tsx` | `@components/z2f/…` |
| date wrapper (if needed) | — | `@components/z2f/date-picker.tsx` |
| sample schema | `@lib/zod-form/schema.ts` | `@lib/example-schema.ts` |
| z2f config | `@lib/zod-form/z2f.config.ts` | `z2f.config.ts` (project root, no alias) |
| example form (starter-react) | `@components/zod-form.tsx` | `@components/example-form.tsx` |
| generated form (starter-codegen) | `@components/generated-form.tsx` | `@components/example-form.tsx` |
| generated form (starter-vite) | `@components/zod-form-vite.tsx` | `@components/example-form.tsx` |

Update imports inside shipped files (`@/components/zod-form` → `@/components/z2f`, schema import → `@/lib/example-schema`).

**Root config drops a workaround:** the Vite plugin and CLI auto-discover `z2f.config.*` at the project root. Today the config ships under `@lib/` and the vite starter passes an explicit `configPath` (with a comment warning it "silently falls back to defaults" otherwise — see `VITE_USAGE` in `items.ts:271`). With the config at root, **remove the `configPath` argument** from the vite starter's plugin setup — auto-discovery handles it.

### 8. Override shapes for Base UI (registry config only)

The registry's own `ADAPTER_OVERRIDES` (`apps/docs/registry/build/items.ts:110`) must be rewritten for the **raw Base UI `ui/*`** prop names that codegen binds Checkbox/Switch against, while Select/RadioGroup keep the adapter (uniform `value`/`onChange`) shape:

```ts
const ADAPTER_OVERRIDES = {
  Input: {},                                  // uncontrolled register — no override
  Textarea: {},                               // uncontrolled register — no override
  // Bound flat to the re-exported Base UI ui/* components:
  Checkbox: { controlled: true, props: { checked: '!!field.value', onCheckedChange: 'field.onChange' } },
  Switch:   { controlled: true, props: { checked: '!!field.value', onCheckedChange: 'field.onChange' } },
  // Composite adapters normalise to the plain RHF field shape (value/onChange):
  Select:      { controlled: true },
  RadioGroup:  { controlled: true },
  // z.date() → thin Date-only controlled wrapper (value/onChange):
  DatePicker:  { controlled: true }
} as const;
```

Notes:
- `Checkbox`/`Switch` now carry an explicit `props` map (Base UI `checked`/`onCheckedChange`) because they bind to the raw `ui/*` component, not an adapter. `checked: '!!field.value'` uses the new allowlist entry (§4); `onCheckedChange: 'field.onChange'` binds directly (Base UI value-first callback).
- `Select`/`RadioGroup`/`DatePicker` keep `controlled: true` with **no** `props` map — they go through adapters/wrappers that accept the uniform `value`/`onChange`/`onBlur`/`name` shape (`ControlledFieldProps`).
- **Do NOT change core's shared `SHADCN_OVERRIDES`** (`packages/core/src/config.ts:423`). That preset is shared with the runtime `shadcnComponentMap`, whose native-`<input>` stubs take `checked`/`onChange`; rewriting it to a Base UI shape would break runtime shadcn-preset users. The Base UI override shape lives **only** in the registry config. (The core allowlist extension `!!field.value` is safe to share — it only widens what expressions *can* be emitted; it changes no existing override.)

## Components / file inventory

**Modify:**
- `packages/core/src/processors/string.ts` (+ the `z.date()` processor) — route string date/time/datetime formats to native input `type` with `component: 'Input'`; reserve `DatePicker` for `z.date()` (§5).
- `packages/codegen/src/generate.ts` — extend `RHF_FIELD_EXPRESSIONS` (line 59) with the `!!field.value` coercion form ONLY; thread `typesModule`; emit the coercion expression. Do **not** touch core's `SHADCN_OVERRIDES`.
- `packages/codegen/src/templates.ts` — `typesModule` knob: import `StripIndexSignature` when set, else inline.
- `apps/docs/registry/build/items.ts` — collapse `ADAPTER_COMPONENT_NAMES` (line 20) to `['select','radio-group']` (+ `'date-picker'` iff §5 wrapper retained); rewrite all `path`/`target`s to the new layout (§7 table); move config to root; rewrite `ADAPTER_OVERRIDES` to the Base UI shape (§8); set `typesModule: '@/components/z2f'`; drop the vite `configPath` (rewrite `VITE_USAGE`, line 271); update `registryDependencies` (add shadcn **Base UI** `date-picker` for the `z.date()` case; native-date fields need no registry dep; ensure all pulled `ui/*` resolve to shadcn's `base` style); update `ZOD_FORM_USAGE` imports to the new layout; ensure the sample schema exercises both a string-date and a `z.date()` field.
- `apps/docs/registry/components/shadcn/index.tsx` — barrel re-exports `ui/*` for `Input`/`Textarea`/`Checkbox`/`Switch`; exports `Select`/`RadioGroup` (+ `DatePicker` if retained); exports `StripIndexSignature` type; drop the `components` map's deleted entries (keep only what ships).
- `apps/docs/registry/components/shadcn/types.ts` — add `FormFieldOption` (inlined) and `StripIndexSignature`.
- `apps/docs/registry/components/shadcn/select.tsx`, `radio-group.tsx` — import `FormFieldOption` from `./types.js` (not `@zod-to-form/core`); confirm they compose against shadcn's **Base UI** `@/components/ui/select` / `@/components/ui/radio-group` exports (component names are identical: `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`; `RadioGroup`/`RadioGroupItem`). The adapters' internal `value`/`onValueChange` mapping is already correct for Base UI (value-first callback).
- `apps/docs/registry/components/shadcn/date-picker.tsx` — rewrite as the thin Date-only controlled wrapper (Popover + Base UI Calendar, `selected={value}`/`onSelect={onChange}`, no parsing), per §5.
- Docs files per §9.
- Source-dir rename `components/shadcn/` → `components/z2f/` is optional/cosmetic (only `target` paths ship).

**Delete:**
- `apps/docs/registry/components/shadcn/input.tsx`, `textarea.tsx`, `checkbox.tsx`, `switch.tsx`.
- Fixtures/tests scoped to the deleted adapters.

**Regenerate:**
- `apps/docs/static/r/*.json` via `pnpm registry:build`.

### 9. Docs / claim accuracy

Carried forward from the Radix design; targets updated for Base UI:
- **`apps/docs/docs/quickstart.md` (~line 63)** — the sample shows a phantom `import type { StripIndexSignature } from '@zod-to-form/core'` that codegen never emits. Replace with the actual generated output (with §6, the starter output imports `StripIndexSignature` from `@/components/z2f` — an owned module — a correct, citable example).
- Audit the claim inventory (`README.md`, `apps/docs/src/pages/index.tsx`, `apps/docs/docs/{intro,quickstart}.md`, `apps/docs/docs/guides/{vite-plugin,optimization}.md`, `skills/zod-to-form-codegen/SKILL.md`, `apps/docs/registry/build/items.ts`) and ensure any *unqualified* "no dependency" phrasing reads as "no **runtime** dependency," with a one-line note that `z2f.config.ts` is build-time tooling.
- Update doc/example references to old paths (`@/components/zod-form`, `@/lib/zod-form/...`) and to date handling for the new layout/routing.
- Note in the starter docs that the registry targets shadcn's **Base UI** components; consumers should `npx shadcn create` choosing Base UI (or have the `base` style installed) so the pulled `ui/*` match.

## Testing

- **Core walker:** `z.string().date()` → `component: 'Input'`, `type: 'date'`; `.time()` → `type: 'time'`; `.datetime()` → `type: 'datetime-local'`; `z.date()` → `component: 'DatePicker'`. Regression-test the format→type routing.
- **Codegen unit tests:** `typesModule` set → output contains `import type { StripIndexSignature } from '<module>'` and NOT the inline block; absent → inline block present, no import. Checkbox/Switch controlled binding emits `checked={!!field.value} onCheckedChange={field.onChange}` (and **no** `=== true` wrapper). A `z.string().date()` field emits `<Input type="date" {...register(...)} />` (no Controller).
- **Parity harness** (extend): a controlled-boolean field resolves to the same `checked`/`onCheckedChange` binding in both renderers; a string-date field resolves to the same native `type=` in both; assert codegen materializes them.
- **Registry adapter tests:** `Select`/`RadioGroup` still typecheck/render with `FormFieldOption` sourced locally against Base UI `ui/*`; add a guard test that greps shipped adapter sources for `@zod-to-form` and asserts none remain.
- **`registry:check`** stays green after regeneration (the new `path`/`target`s round-trip through `build-registry`).
- **End-to-end smoke (manual / CI-optional):** `npx shadcn create` (Base UI) a scratch project, `npx shadcn add` the regenerated starters, then `tsc` — expect zero `@zod-to-form/*` imports in the owned tree, files at the new layout (root `z2f.config.ts`, `@/components/z2f/`, `@/lib/example-schema.ts`), Checkbox/Switch binding flat against Base UI, Select/RadioGroup rendering options via adapters, string-date fields as native inputs, `z.date()` via the Base UI date-picker wrapper, and a clean typecheck.

## Non-goals

- Changing the runtime `shadcnComponentMap` (separate native-stub implementation; unaffected).
- A per-component import-source feature in codegen (the barrel re-export keeps a single `components.source`).
- Removing `@zod-to-form/core` from `z2f.config.ts` / making the project literally zero-z2f including build-time (deferred — "zero at runtime" is the chosen target).
- Teaching codegen to inline composite structure (Select/RadioGroup option trees) — those adapters remain the home for options composition.
- Shipping **both** a Radix and a Base UI variant of the registry (out of scope; this respec picks one target — see Risks for the migration concern).

## Risks

- **Premise reversal — Base UI does NOT eliminate the Select/RadioGroup adapters.** The whole motivation ("options-native Base UI Select") is only half-true: `items` is for label lookup, not auto-rendering. Adapter count is the same as Radix. The net Base UI benefit is the Checkbox/Switch normalization removal + alignment with shadcn's default-for-new-projects primitive. If that benefit doesn't justify the migration churn, **the Radix design remains a valid alternative** (see Recommendation).
- **Migration maturity / GA status.** Base UI is at 1.5.x with a versioned API reference and is the MUI team's flagship; shadcn ships full Base UI docs (Jan 2026) and offers it as a `create`-time choice. It is **production-usable but newer than Radix**; shadcn's own guidance is gradual migration and "keep Radix unless you have a specific pain point." There is no announced Radix deprecation — both sets are supported. Treat Base UI as **stable-but-young**, not battle-hardened.
- **Breaking change for #129 adopters.** PR #129 (merged 2026-05-26) shipped the **Radix** starters. Anyone who pulled `starter-react/codegen/vite` now has Radix-based `ui/*` and Radix-shaped adapters. Switching the registry to Base UI changes: (a) the `ui/*` components a re-pull installs (Base UI vs Radix — different `asChild` vs `render` internals), (b) the Checkbox/Switch override prop wiring, (c) the date-picker dependency. A consumer who installed the Radix starter and re-runs `shadcn add` after this lands gets a **mismatched mix** unless they re-init with Base UI. Since the registry is brand-new (one day old) the installed-base is presumably near-zero, but this must be a **conscious cutover**, not silent. Document it; consider a changeset note + version bump on the registry items.
- **`z.date()` wrapper depends on shadcn's Base UI Calendar API.** Verified self-stateful (`useState<Date>`, `<Calendar selected onSelect>`); the thin wrapper bridges to controlled `value`/`onChange`. If shadcn changes the Base UI Calendar prop names, the wrapper needs updating. Pin/verify against the actual `npx shadcn add date-picker` (base) output in planning.
- **Checkbox/Switch ref handling.** Base UI exposes the hidden input via `inputRef`, not the root `ref`. Codegen's controlled binding omits the root ref for these (RHF controlled fields don't need it for value tracking), but focus-on-error and some a11y patterns rely on a focusable ref. **Open item below.**
- **Core walker change** (date-format routing) affects both renderers and existing date tests/snapshots; covered by walker regression tests + parity harness. Existing forms that rendered the fancy picker for string dates now render native inputs — a deliberate, documented behavior change.
- **Coercion expression extension** widens the field-expression allowlist; keep it to the specific `!!field.value` form, not arbitrary expressions, to avoid an injection surface.
- **`typesModule` multi-file output** softens the "single self-contained file" story; mitigated by opt-in (default stays inline).
- **Path churn** across registry items + shipped imports; `registry:check` round-trip + e2e smoke are the safety net.
- Work spans `core`, `codegen`, `apps/docs/registry` (published / registry-facing) → changeset required; sequence after the in-flight parity release.

## Open items to verify in planning (do not guess)

1. **shadcn Base UI date-picker exact prop names** — confirmed self-stateful with `<Calendar mode="single" selected onSelect>`; verify the precise exported names and whether the Calendar accepts a controlled `selected`/`onSelect` from a parent (the wrapper relies on it). Run `npx shadcn add date-picker` against a `base`-style project.
2. **Checkbox/Switch `inputRef` vs `ref` for RHF** — decide whether codegen should thread `field.ref` to `inputRef` (so focus-on-error works) or omit it. Verify a controlled Base UI Checkbox validates + submits + focuses-on-error without a ref, or wire `inputRef={field.ref}` into the override props if needed.
3. **shadcn Base UI Select/RadioGroup export names** — verify identical to the Radix versions (`Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`; `RadioGroup`/`RadioGroupItem`) so the surviving adapters need no structural change beyond the `FormFieldOption` import swap.
4. **`onValueChange` value-first contract for Select** — confirmed `(value, eventDetails)`; verify the adapter's `onValueChange={(v) => onChange?.(v)}` still discards the second arg correctly (it does, by closure).
5. **Whether to keep a Radix variant** — product decision: single Base UI target (this spec) vs. dual registry. Recommend single, given near-zero install base.

## Decisions (resolved during this respec)

- **Target = shadcn Base UI** (`/components/base/*`), single registry variant.
- Base UI Select/RadioGroup are **not** options-native for rendering → **Select + RadioGroup adapters KEPT** (same count as Radix). Input/Textarea/Checkbox/Switch adapter files **deleted**, bound flat to re-exported `ui/*`.
- Checkbox/Switch coercion: emit `checked={!!field.value} onCheckedChange={field.onChange}` (extend allowlist); **drop** the Radix `=== true` normalization (Base UI callback is plain `boolean`).
- `FormFieldOption` still inlined into `@/components/z2f/types.ts` (adapters still consume it).
- Ownership target = **zero z2f at runtime**; `z2f.config.ts` keeps its build-time `core` devDep.
- DatePicker = route by schema type — string date/time/datetime → native inputs (Tier-1); `z.date()` → shadcn Base UI `date-picker` registryDependency + thin parsing-free Date-only wrapper (shadcn's version is self-stateful, so the wrapper is required).
- `StripIndexSignature` = owned `@/components/z2f/types.ts`, opt-in via `typesModule` (inline remains standalone default).
- Override shape lives in registry config only; core `SHADCN_OVERRIDES` untouched.
- Layout = `z2f`-branded integration files vs. neutral `example-*` domain names; root config.

## Recommendation (proceed now vs. defer)

**Proceed, but as a conscious cutover with eyes open — and only if alignment-with-shadcn-defaults is the real motivation, not adapter elimination.** The original brainstorm's headline win (delete Select/RadioGroup via Base UI's options-native API) does **not** materialize; adapter count is unchanged. The genuine, smaller wins are: (a) Checkbox/Switch binding drops the `boolean | 'indeterminate'` normalization, (b) the registry aligns with shadcn's default-for-new-projects primitive (Base UI), (c) native-date routing + zero-runtime-z2f land regardless of Radix vs Base UI (those are independent of this decision).

Base UI is stable (1.5.x, MUI-backed, full shadcn docs) but younger than Radix and shadcn explicitly recommends gradual migration. The #129 Radix starters are one day old (near-zero install base), so the cutover cost is low *now* and grows with adoption — favoring acting sooner rather than later if acting at all.

If the team's priority is purely "make the ownership claim true + clean the layout + native dates," **the Radix design already achieves all of that** with a more mature primitive and zero migration risk; Base UI is then optional polish. If the team wants the registry to match what `npx shadcn create` gives new users by default, **switch to Base UI now** while the blast radius is minimal. Either way, the **core/codegen changes (§4–§6) and layout (§7) are target-agnostic** and can land first; the Base-UI-vs-Radix `ui/*` + override choice (§1–§3, §8) is the only part gated on this decision.

## Suggested implementation decomposition

- **Plan A (code):** core changes (field-expression `!!field.value` + date-format routing) → codegen `typesModule` + coercion → registry relayout for Base UI (paths/targets, barrel, types, composites, adapter deletions, Base UI date wrapper, root config, drop vite `configPath`, Base UI override shapes) → regenerate → tests + parity + e2e smoke. Testable end to end.
- **Plan B (docs):** quickstart sample fix + claim-wording audit + old-path/date references + Base UI target note across the inventory. Prose; lands alongside or just after A.

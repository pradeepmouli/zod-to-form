# Design: genuinely-owned codegen output (Tier-3 adapters + zero runtime z2f dependency)

**Date:** 2026-05-26
**Status:** Approved (design); pending spec review → implementation plan(s)

> **Superseded by** [`2026-05-26-codegen-owned-output-baseui-design.md`](./2026-05-26-codegen-owned-output-baseui-design.md) — which retargets the registry from Radix to shadcn's Base UI components. This Radix-based spec remains a valid alternative if Base UI migration is deferred (see that spec's Recommendation).

## Goal

Make z2f's central marketing claim — *"eject to generated code you fully own; no runtime dependency on any `@zod-to-form` package; stop using zod-to-form entirely and the generated code keeps working"* — **literally true** for the codegen path; slim the shadcn registry adapter layer to only the components whose logic codegen bindings + native primitives genuinely cannot express; and clean up the ejected file layout so it reads as "your code + a clearly-labelled z2f integration layer."

Intertwined problems, one cohesive fix:
1. **Dependency leak.** The generated form file is already z2f-free, but the adapters it imports are not: `select.tsx` and `radio-group.tsx` both `import type { FormFieldOption } from '@zod-to-form/core'`, and the codegen starter declares `@zod-to-form/core` as a `devDependency`. So a form with a Select/RadioGroup field transitively pulls `@zod-to-form/core` into "owned" code.
2. **Adapter bloat.** Of the seven shipped adapters, four (`Input`, `Textarea`, `Checkbox`, `Switch`) carry little or no logic that codegen bindings can't express, and `DatePicker`'s logic exists only because z2f forces both `z.date()` and string-date schemas through one hand-rolled Date picker. Only `Select`/`RadioGroup` (options iteration) are truly irreducible.
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
      select.tsx, radio-group.tsx   ← composite adapters (options iteration — irreducible)
    example-form.tsx                ← sample runtime <ZodForm> usage (YOURS; neutral name)
    ui/*                            ← shadcn primitives (incl. shadcn's own date-picker; from shadcn's registry)
```

Generated form imports: `react-hook-form`, `zod`, `@hookform/resolvers`, `@/lib/example-schema`, `@/components/z2f`, and (for date fields) native inputs or `@/components/ui/*`. **Zero `@zod-to-form/*`.**

## Background: what the adapters actually do

- **Pure passthrough** (`Input`, `Textarea`): `<ShadcnInput ref {...props} />`. Zero logic. The raw shadcn `ui/input` is already `register`-compatible (forwards a ref to a native input).
- **Flat coercion** (`Checkbox`, `Switch`): translate RHF's `value`/`onChange` to Radix's `checked`/`onCheckedChange`, plus `checked={!!value}` (undefined→false, avoiding React's controlled/uncontrolled warning when a boolean field has no default) and `onChange(c === true)` (normalizing Radix's `boolean | 'indeterminate'`).
- **Options composition** (`Select`, `RadioGroup`): assemble a tree of shadcn subcomponents and **iterate over `options`** (`SelectTrigger`/`Content`/`Item`; `RadioGroupItem` + `Label` per option). **Irreducible** — a flat codegen prop-binding cannot emit `options.map`.
- **Date parsing/composition** (`DatePicker`): wraps `Popover` + shadcn `Calendar`, and converts `value` between `string` and `Date` (`new Date(value)`, invalid-date guard, `stringMode`, `format(d,'yyyy-MM-dd')`). This conversion exists **only because** z2f routes both `z.date()` and `z.string().date()/.time()/.datetime()` to one Date-based picker. react-day-picker (the Calendar engine) is `Date`-only and does not parse strings — so the conversion is z2f's, not the primitive's. §4 removes it.

The runtime `shadcnComponentMap` (`packages/react/src/shadcn/index.ts`) is a **separate** implementation — native HTML stubs with shadcn class names, uncontrolled, works without shadcn installed. It is out of scope here; this design touches only the codegen/registry path. (Its own `import { FormFieldOption } from '@zod-to-form/core'` is fine — that is the library's internal dependency, not user-owned code.)

## Architecture

### 1. Collapse the registry adapters to options-composites only

`@/components/z2f/index.tsx` (the barrel) remains the single import surface but becomes a thin aggregator:

```tsx
// Re-export raw shadcn primitives (register-/Radix-compatible as-is)
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Checkbox } from '@/components/ui/checkbox';
export { Switch } from '@/components/ui/switch';
// Composite adapters (kept — options iteration is irreducible)
export { Select } from './select';
export { RadioGroup } from './radio-group';
// shadcn Form* layout wrappers (unchanged)
export { FormItem, FormControl, FormLabel, FormMessage, FormDescription, FormField } from '@/components/ui/form';
// Owned form-data type utility (see §5)
export type { StripIndexSignature } from './types';
```

- **Delete** adapter files: `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `switch.tsx` (and `date-picker.tsx` per §4).
- **Keep** adapter files: `select.tsx`, `radio-group.tsx`.

### 2. Sever the runtime z2f dependency

Inline `FormFieldOption` into the already-owned `@/components/z2f/types.ts` (it is a flat 3-field interface: `{ value: string | number; label: string; disabled?: boolean }`, no transitive z2f types). Drop the `@zod-to-form/core` import from `select.tsx`/`radio-group.tsx`.

**Result:** every owned **runtime** file (generated form, all adapters, `ui/*`, `types.ts`) carries **zero `@zod-to-form/*` imports**. The only remaining z2f touchpoint is `z2f.config.ts` (`import { defineConfig } from '@zod-to-form/core'`), which is **build-time tooling**: needed only to re-generate. On a full eject (delete the config, uninstall core) the generated form still compiles and runs. The "no *runtime* dependency / keeps working without z2f" claim becomes literally true.

### 3. Codegen emits the Checkbox/Switch coercion

With the `Checkbox`/`Switch` adapters gone, codegen binds the raw `ui/*` (Radix) components directly:

```tsx
<Controller name={"subscribe"} control={control} render={({ field }) => (
  <Checkbox checked={!!field.value} onCheckedChange={field.onChange}
            id="subscribe" name={field.name} onBlur={field.onBlur} ref={field.ref} />
)} />
```

This requires the field-expression resolver to recognize a coercion form. Today `RHF_FIELD_EXPRESSIONS` is an allowlist of exact strings (`'field.value'` → emitted as `{field.value}`). Add `'!!field.value'` → emitted as `{!!field.value}`. The resolver already wraps recognized strings in `{…}`, so this is an allowlist + emit extension in `@zod-to-form/core`, consumed by codegen (and available to the runtime controlled path for consistency).

The override *shape* change lives in the **registry's own config** (`ADAPTER_OVERRIDES` in `apps/docs/registry/build/items.ts`), which now targets the raw `ui/*` Radix components:

```ts
Checkbox: { controlled: true, props: { checked: '!!field.value', onCheckedChange: 'field.onChange' } }
Switch:   { controlled: true, props: { checked: '!!field.value', onCheckedChange: 'field.onChange' } }
```

**Do NOT change core's `SHADCN_OVERRIDES`.** That preset is shared with the runtime `shadcnComponentMap`, whose native-`<input type=checkbox>` stubs take `checked`/`onChange` (not `onCheckedChange`); rewriting the shared preset to a Radix shape would break runtime shadcn-preset users. The registry config is the correct, isolated home for the raw-Radix binding. (The core allowlist extension is safe to share — it only widens what expressions *can* be emitted; it changes no existing override.)

`Input`/`Textarea` need no override — they bind uncontrolled via `register` against the native-backed `ui/*` primitives.

`onCheckedChange={field.onChange}` forwards Radix's `boolean | 'indeterminate'` to RHF. z2f never sets indeterminate state, so for a `z.boolean()` field this is always a boolean; the `=== true` normalization the old adapter did is unreachable in practice and is intentionally dropped.

### 4. DatePicker: route by schema type (native inputs + shadcn date-picker dep)

The bespoke `DatePicker` adapter exists only to bridge string-vs-Date through one Date-based picker. Match the primitive to the schema's value type instead:

- **`z.string().date()` / `.time()` / `.datetime()`** (ISO-string-valued) → native `<input type="date" | "time" | "datetime-local">`. String-valued, `register`-compatible, **Tier-1 (no adapter, no conversion)**. This also fixes the current "time precision lost" limitation, since native `time`/`datetime-local` inputs carry time.
- **`z.date()`** (JS `Date` object) → shadcn's installable `date-picker` (Popover + Calendar), pulled as a **registryDependency** rather than hand-authored. Bound controlled via `value`/`onChange` (Date-native — no string conversion).

**Core walker change.** Today the string processor routes all date-ish formats to `component: 'DatePicker'` (`DATE_PICKER_FORMATS` in `packages/core/src/processors/string.ts`). Change it so string date/time/datetime formats set the native input `type` (`'date'`/`'time'`/`'datetime-local'`) and keep `component: 'Input'`; reserve the `DatePicker` component for the `z.date()` (Date-object) processor.

**Open item (resolve in planning):** shadcn's `date-picker` ships as a *self-stateful example* (`const [date, setDate] = useState<Date>()`), not a controlled component. If that holds, `z.date()` fields need a **thin Date-only controlled wrapper** (`@/components/z2f/date-picker.tsx`) that exposes `value`/`onChange` over the shadcn composition — but with **zero parsing logic** (Date in, Date out), a fraction of today's adapter and still zero-z2f. If a controlled variant is available, even that wrapper disappears. Verify against the actual `npx shadcn add date-picker` output before finalizing the plan.

Net: the parsing-heavy `DatePicker` adapter is removed; Tier-3 z2f-authored adapters reduce to `Select` + `RadioGroup`. (`date-fns` is retained only if the `z.date()` wrapper / shadcn date-picker needs it; string-date fields need no date library.)

### 5. Move `StripIndexSignature` to an owned shared module (opt-in)

Today `generateFormComponent` inlines the ~18-line `StripIndexSignature<T>` block into every generated form (`packages/codegen/src/templates.ts`). Add an optional codegen config knob — `typesModule?: string` (an import specifier):

- **When set:** codegen emits `import type { StripIndexSignature } from '<typesModule>'` instead of inlining the block. The form's `FormData`/`FormOutput` types reference the imported utility.
- **When absent (default):** inline as today — preserving the self-contained single-file output for standalone `npx zodform generate` users.

The registry starters set `typesModule: '@/components/z2f'` (the barrel), so the generated starter form imports `StripIndexSignature` from the **same** module it imports components from — one owned import surface, zero `@zod-to-form/*`. `StripIndexSignature` is added to `@/components/z2f/types.ts` alongside `ControlledFieldProps` and `FormFieldOption`.

### 6. Relayout the ejected files (folder rename + root config + neutral sample names)

The current layout has the example form (`@components/zod-form.tsx`) shadowing the adapter directory (`@components/zod-form/`), so `import { components } from '@/components/zod-form'` resolves to the file (no `components` export) instead of the barrel, and `z2f.config.ts`'s `typeof import('@/components/zod-form')` sees only `ExampleForm`. The relayout fixes this and applies the naming principle. In `apps/docs/registry/build/items.ts` (and the adapter source dir), update every file's `path`/`target`:

| concern | old target | new target |
| --- | --- | --- |
| adapter barrel | `@components/zod-form/index.tsx` | `@components/z2f/index.tsx` |
| adapter types | `@components/zod-form/types.ts` | `@components/z2f/types.ts` |
| composite adapters | `@components/zod-form/{select,radio-group}.tsx` | `@components/z2f/…` |
| sample schema | `@lib/zod-form/schema.ts` | `@lib/example-schema.ts` |
| z2f config | `@lib/zod-form/z2f.config.ts` | `z2f.config.ts` (project root, no alias) |
| example form (starter-react) | `@components/zod-form.tsx` | `@components/example-form.tsx` |
| generated form (starter-codegen) | `@components/generated-form.tsx` | `@components/example-form.tsx` |
| generated form (starter-vite) | `@components/zod-form-vite.tsx` | `@components/example-form.tsx` |

The folder rename to `z2f/` independently resolves the collision (the example form no longer shadows the directory); the example-form/example-schema renames are the naming-principle cleanup. Update the imports inside the shipped files accordingly (`@/components/zod-form` → `@/components/z2f`, schema import → `@/lib/example-schema`).

**Root config drops a workaround:** the Vite plugin and CLI auto-discover `z2f.config.*` at the project root. Today the config ships under `@lib/` and the **vite starter passes an explicit `configPath`** to compensate (with a comment warning it "silently falls back to defaults" otherwise). With the config at root, **remove the `configPath` argument** from the vite starter's plugin setup — auto-discovery handles it.

### 7. Docs / claim accuracy

Once §2 lands, the strongest claim ("no runtime dependency … stop using zod-to-form entirely and the generated code keeps working") is true at runtime and may stand. Concrete corrections required:

- **`apps/docs/docs/quickstart.md:63-64`** — the code sample shows a phantom `import type { StripIndexSignature } from '@zod-to-form/core'` that codegen never emits. Replace with the actual generated output. (With §5, the registry/starter output now imports `StripIndexSignature` from `@/components/z2f` — an owned module — which is a correct, citable example.)
- Audit the claim inventory (README.md, `apps/docs/src/pages/index.tsx`, `intro.md`, `quickstart.md`, `guides/vite-plugin.md`, `guides/optimization.md`, `skills/zod-to-form-codegen/SKILL.md`, `apps/docs/registry/build/items.ts`) and ensure any *unqualified* "no dependency" phrasing reads as "no **runtime** dependency," with a one-line note that `z2f.config.ts` is build-time tooling.
- Update any doc/example that references the old paths (`@/components/zod-form`, `@/lib/zod-form/...`) or the date handling to the new layout/routing.

## Components / file inventory

**Modify:**
- `packages/core/src/processors/string.ts` (+ the date/`z.date()` processor) — route string date/time/datetime formats to native input `type` with `component: 'Input'`; reserve `DatePicker` for `z.date()` (§4).
- `packages/core/src/config.ts` — extend the field-expression allowlist (`RHF_FIELD_EXPRESSIONS`) with the `!!field.value` coercion form ONLY. Do **not** touch `SHADCN_OVERRIDES` (shared with the runtime native-stub preset; see §3).
- `packages/codegen/src/templates.ts` — `typesModule` config knob: import `StripIndexSignature` when set, else inline.
- `packages/codegen/src/generate.ts` — thread `typesModule`; emit the coercion expression.
- `apps/docs/registry/build/items.ts` — collapse the adapter file list to `select`/`radio-group`; rewrite all `path`/`target`s to the new layout (§6 table); move config to root; update `ADAPTER_OVERRIDES` to the raw-ui Radix shape; set `typesModule`; drop the vite `configPath` argument; update `registryDependencies` (add shadcn `date-picker` for the `z.date()` case; native-date fields need no registry dep); ensure the sample schema exercises a representative date field.
- `apps/docs/registry/components/shadcn/index.tsx` — barrel re-exports `ui/*` for `Input`/`Textarea`/`Checkbox`/`Switch`; exports `Select`/`RadioGroup`; exports `StripIndexSignature` type.
- `apps/docs/registry/components/shadcn/types.ts` — add `FormFieldOption` (inlined) and `StripIndexSignature`.
- `apps/docs/registry/components/shadcn/select.tsx`, `radio-group.tsx` — import `FormFieldOption` from `./types.js` instead of `@zod-to-form/core`.
- (Optional: rename the registry source dir `components/shadcn/` to match `z2f/`; only the `target` paths ship, so the source-dir rename is cosmetic.)
- Docs files per §7.

**Delete:**
- `apps/docs/registry/components/shadcn/input.tsx`, `textarea.tsx`, `checkbox.tsx`, `switch.tsx`.
- `apps/docs/registry/components/shadcn/date-picker.tsx` — UNLESS the §4 open item shows a thin Date-only controlled wrapper is needed, in which case rewrite it (parsing-free) rather than delete.
- Fixtures/tests scoped to the deleted adapters.

**Regenerate:**
- `apps/docs/static/r/*.json` via `pnpm registry:build`.

## Testing

- **Core walker:** `z.string().date()` → `component: 'Input'`, `type: 'date'`; `.time()` → `type: 'time'`; `.datetime()` → `type: 'datetime-local'`; `z.date()` → `component: 'DatePicker'`. Regression-test the format→type routing.
- **Codegen unit tests:** `typesModule` set → output contains `import type { StripIndexSignature } from '<module>'` and NOT the inline block; absent → inline block present, no import. Checkbox/Switch controlled binding emits `checked={!!field.value} onCheckedChange={field.onChange}`. A `z.string().date()` field emits `<Input type="date" {...register(...)} />` (no Controller).
- **Parity harness** (extend): a controlled-boolean field resolves to the same `checked`/`onCheckedChange` binding in both renderers; a string-date field resolves to the same native `type=` in both; assert codegen materializes them.
- **Registry adapter tests:** `Select`/`RadioGroup` still typecheck/render with `FormFieldOption` sourced locally; add a guard test that greps shipped adapter sources for `@zod-to-form` and asserts none remain.
- **`registry:check`** stays green after regeneration (the new `path`/`target`s round-trip through `build-registry`).
- **End-to-end smoke (manual / CI-optional):** `npx shadcn add` the regenerated starter into a scratch project with `shadcn init`, then `tsc` — expect zero `@zod-to-form/*` imports in the owned tree, files at the new layout (root `z2f.config.ts`, `@/components/z2f/`, `@/lib/example-schema.ts`), date fields rendering as native inputs / shadcn date-picker, and a clean typecheck (the bug this whole effort started from).

## Non-goals

- Changing the runtime `shadcnComponentMap` (separate native-stub implementation; unaffected).
- A per-component import-source feature in codegen (the barrel re-export keeps a single `components.source`; not needed).
- Removing `@zod-to-form/core` from `z2f.config.ts` / making the project literally zero-z2f including build-time (explicitly deferred — "zero at runtime" is the chosen target; `defineConfig`'s preset-merge + inference are worth the build-time devDep).
- Teaching codegen to inline composite structure (`Select`/`RadioGroup` option trees) — those adapter files remain the home for options composition. (`DatePicker` is *not* in this bucket — §4 removes it by routing to native primitives / a shadcn dep.)

## Risks

- **Core walker change** (date-format routing) affects both renderers and existing date tests/snapshots; covered by the walker regression tests + parity harness. Existing forms that rendered the fancy picker for string dates will now render native date inputs — a deliberate behavior change to document.
- **shadcn `date-picker` shape unknown** — whether it's controller-bindable or self-stateful determines if a thin wrapper survives; resolved by the §4 open-item verification before the plan finalizes.
- **Coercion expression extension** widens the field-expression allowlist; keep it to the specific `!!field.value` form, not arbitrary expressions, to avoid an injection surface in generated code.
- **`typesModule` multi-file output** softens the "single self-contained file" story; mitigated by making it opt-in (default stays inline).
- **Barrel re-export of raw `ui/*`** means `Checkbox`/`Switch` are now the raw Radix components; the generated `checked={!!field.value}` binding must be correct or the control silently misbehaves — covered by the parity test + e2e smoke.
- **Path churn** across the registry items + shipped file imports; the `registry:check` round-trip and the e2e smoke are the safety net.
- The work spans `core`, `codegen`, and `apps/docs/registry` (all published or registry-facing) → changeset required; sequence after the in-flight release of the Stage-1 parity work.

## Decisions (resolved during brainstorming)

- Ownership target = **zero z2f at runtime**; `z2f.config.ts` keeps its build-time `core` devDep.
- Collapse scope = **full Tier-3** (drop `Input`/`Textarea`/`Checkbox`/`Switch` adapter files; bind to `ui/*`).
- Checkbox/Switch coercion = **codegen emits `checked={!!field.value}`** (extend field-expression allowlist), not a `z.boolean().default()` requirement.
- DatePicker = **route by schema type** — string date/time/datetime → native inputs (Tier-1); `z.date()` → shadcn `date-picker` registryDependency (+ thin parsing-free wrapper iff shadcn's version is self-stateful). Removes the bespoke DatePicker adapter; adds a core-walker change.
- `StripIndexSignature` = move to the owned **`@/components/z2f/types.ts`** (surfaced via the barrel), **opt-in** via `typesModule` (inline remains the standalone default).
- Import surface = keep the **single barrel** (`@/components/z2f`); no per-component source routing.
- Layout = `z2f`-branded integration files (`z2f.config.ts` at root, `@/components/z2f/`) vs. neutral `example-`/domain names (`@/lib/example-schema.ts`, `@/components/example-form.tsx`).

## Suggested implementation decomposition

- **Plan A (code):** core changes (field-expression `!!field.value` + date-format routing) → codegen `typesModule` + coercion → registry relayout (paths/targets, barrel, types, composites, adapter deletions, date handling, root config, drop vite `configPath`) → regenerate → tests + parity + e2e smoke. Testable end to end.
- **Plan B (docs):** quickstart sample fix + claim-wording audit + old-path/date references across the inventory. Prose; can land alongside or just after A.

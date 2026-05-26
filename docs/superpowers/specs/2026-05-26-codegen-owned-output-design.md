# Design: genuinely-owned codegen output (Tier-3 adapters + zero runtime z2f dependency)

**Date:** 2026-05-26
**Status:** Approved (design); pending spec review → implementation plan(s)

## Goal

Make z2f's central marketing claim — *"eject to generated code you fully own; no runtime dependency on any `@zod-to-form` package; stop using zod-to-form entirely and the generated code keeps working"* — **literally true** for the codegen path, and slim the shadcn registry adapter layer to only what cannot be expressed by codegen bindings.

Two intertwined problems, one cohesive fix:
1. **Dependency leak.** The generated form file is already z2f-free, but the adapters it imports from `@/components/zod-form` are not: `select.tsx` and `radio-group.tsx` both `import type { FormFieldOption } from '@zod-to-form/core'`, and the codegen starter declares `@zod-to-form/core` as a `devDependency`. So a form with a Select/RadioGroup field transitively pulls `@zod-to-form/core` into "owned" code.
2. **Adapter bloat.** Of the seven shipped adapters, four (`Input`, `Textarea`, `Checkbox`, `Switch`) carry little or no logic that codegen bindings can't express. Only the three composites (`Select`, `RadioGroup`, `DatePicker`) require real component composition.

## Background: what the adapters actually do

- **Pure passthrough** (`Input`, `Textarea`): `<ShadcnInput ref {...props} />`. Zero logic. The raw shadcn `ui/input` is already `register`-compatible (forwards a ref to a native input).
- **Flat coercion** (`Checkbox`, `Switch`): translate RHF's `value`/`onChange` to Radix's `checked`/`onCheckedChange`, plus `checked={!!value}` (undefined→false, avoiding React's controlled/uncontrolled warning when a boolean field has no default) and `onChange(c === true)` (normalizing Radix's `boolean | 'indeterminate'`).
- **Composition** (`Select`, `RadioGroup`, `DatePicker`): assemble a tree of shadcn subcomponents and iterate (`SelectTrigger`/`Content`/`Item`; `RadioGroupItem` + `Label` per option; `Popover` + `Calendar` + date parsing). **Irreducible** — a flat codegen prop-binding cannot emit nested JSX, `options.map`, or date logic.

The runtime `shadcnComponentMap` (`packages/react/src/shadcn/index.ts`) is a **separate** implementation — native HTML stubs with shadcn class names, uncontrolled, works without shadcn installed. It is out of scope here; this design touches only the codegen/registry path. (Its own `import { FormFieldOption } from '@zod-to-form/core'` is fine — that is the library's internal dependency, not user-owned code.)

## Architecture

### 1. Collapse the registry adapters to composites only

`@/components/zod-form/index.tsx` (the barrel) remains the single import surface but becomes a thin aggregator:

```tsx
// Re-export raw shadcn primitives (register-/Radix-compatible as-is)
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Checkbox } from '@/components/ui/checkbox';
export { Switch } from '@/components/ui/switch';
// Composite adapters (kept — irreducible composition)
export { Select } from './select';
export { RadioGroup } from './radio-group';
export { DatePicker } from './date-picker';
// shadcn Form* layout wrappers (unchanged)
export { FormItem, FormControl, FormLabel, FormMessage, FormDescription, FormField } from '@/components/ui/form';
// Owned form-data type utility (see §4)
export type { StripIndexSignature } from './types';
```

- **Delete** adapter files: `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `switch.tsx`.
- **Keep** adapter files: `select.tsx`, `radio-group.tsx`, `date-picker.tsx`.

### 2. Sever the runtime z2f dependency

Inline `FormFieldOption` into the already-owned `@/components/zod-form/types.ts` (it is a flat 3-field interface: `{ value: string | number; label: string; disabled?: boolean }`, no transitive z2f types). Drop the `@zod-to-form/core` import from `select.tsx`/`radio-group.tsx`.

**Result:** every owned **runtime** file (`generated-form.tsx`, all adapters, `ui/*`, `types.ts`) carries **zero `@zod-to-form/*` imports**. The only remaining z2f touchpoint is `z2f.config.ts` (`import { defineConfig } from '@zod-to-form/core'`), which is **build-time tooling**: needed only to re-generate. On a full eject (delete the config, uninstall core) the generated form still compiles and runs. The "no *runtime* dependency / keeps working without z2f" claim becomes literally true.

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

### 4. Move `StripIndexSignature` to an owned shared module (opt-in)

Today `generateFormComponent` inlines the ~18-line `StripIndexSignature<T>` block into every generated form (`packages/codegen/src/templates.ts`). Add an optional codegen config knob — `typesModule?: string` (an import specifier):

- **When set:** codegen emits `import type { StripIndexSignature } from '<typesModule>'` instead of inlining the block. The form's `FormData`/`FormOutput` types reference the imported utility.
- **When absent (default):** inline as today — preserving the self-contained single-file output for standalone `npx zodform generate` users.

The registry starters set `typesModule: '@/components/zod-form'` (the barrel), so the generated starter form imports `StripIndexSignature` from the **same** module it imports components from — one owned import surface, zero `@zod-to-form/*`. `StripIndexSignature` is added to `@/components/zod-form/types.ts` alongside `ControlledFieldProps` and `FormFieldOption`.

### 5. Fix the `zod-form.tsx` ↔ `zod-form/` path collision

The starter-react example form installs at `@components/zod-form.tsx`, shadowing the `@components/zod-form/` adapter directory: `import { components } from '@/components/zod-form'` resolves to the file (no `components` export) instead of the barrel, and `z2f.config.ts`'s `typeof import('@/components/zod-form')` sees only `ExampleForm`. Rename the example form file:

- `apps/docs/registry/build/items.ts`: starter-react example form `path: 'zod-form.tsx'` → `'example-form.tsx'`, `target: '@components/zod-form.tsx'` → `'@components/example-form.tsx'`.

The example form's `import { components } from '@/components/zod-form'` then unambiguously resolves to the barrel.

### 6. Docs / claim accuracy

Once §2 lands, the strongest claim ("no runtime dependency … stop using zod-to-form entirely and the generated code keeps working") is true at runtime and may stand. Concrete corrections required:

- **`apps/docs/docs/quickstart.md:63-64`** — the code sample shows a phantom `import type { StripIndexSignature } from '@zod-to-form/core'` that codegen never emits. Replace with the actual generated output. (Note: with §4, the registry/starter output now imports `StripIndexSignature` from `@/components/zod-form` — an owned module — which is a correct, citable example.)
- Audit the claim inventory (README.md, `apps/docs/src/pages/index.tsx`, `intro.md`, `quickstart.md`, `guides/vite-plugin.md`, `guides/optimization.md`, `skills/zod-to-form-codegen/SKILL.md`, `apps/docs/registry/build/items.ts`) and ensure any *unqualified* "no dependency" phrasing reads as "no **runtime** dependency," with a one-line note that `z2f.config.ts` is build-time tooling.

## Components / file inventory

**Modify:**
- `packages/core/src/config.ts` — extend the field-expression allowlist (`RHF_FIELD_EXPRESSIONS`) with the `!!field.value` coercion form ONLY. Do **not** touch `SHADCN_OVERRIDES` (shared with the runtime native-stub preset; see §3).
- `packages/codegen/src/templates.ts` — `typesModule` config knob: import `StripIndexSignature` when set, else inline.
- `packages/codegen/src/generate.ts` — thread `typesModule`; emit the coercion expression.
- `apps/docs/registry/build/items.ts` — collapse the adapter file list to the 3 composites; update barrel content; update `ADAPTER_OVERRIDES` to the raw-ui Radix shape; rename the example form; set `typesModule` on the codegen/react starters.
- `apps/docs/registry/components/shadcn/index.tsx` — barrel re-exports `ui/*` for `Input`/`Textarea`/`Checkbox`/`Switch`; exports the 3 composites; exports `StripIndexSignature` type.
- `apps/docs/registry/components/shadcn/types.ts` — add `FormFieldOption` (inlined) and `StripIndexSignature`.
- `apps/docs/registry/components/shadcn/select.tsx`, `radio-group.tsx` — import `FormFieldOption` from `./types.js` instead of `@zod-to-form/core`.
- Docs files per §6.

**Delete:**
- `apps/docs/registry/components/shadcn/input.tsx`, `textarea.tsx`, `checkbox.tsx`, `switch.tsx` (+ any fixtures/tests scoped to them).

**Regenerate:**
- `apps/docs/static/r/*.json` via `pnpm registry:build`.

## Testing

- **Codegen unit tests:** `typesModule` set → output contains `import type { StripIndexSignature } from '<module>'` and NOT the inline block; absent → inline block present, no import. Checkbox/Switch controlled binding emits `checked={!!field.value} onCheckedChange={field.onChange}`.
- **Parity harness** (extend): a controlled-boolean field resolves to the same `checked`/`onCheckedChange` binding in both renderers' resolution; assert codegen materializes `checked={!!field.value}`.
- **Registry adapter tests:** the 3 composite adapters still typecheck/render with `FormFieldOption` sourced locally; no `@zod-to-form/*` import remains in any shipped adapter (add a guard test that greps shipped adapter sources for `@zod-to-form`).
- **`registry:check`** stays green after regeneration.
- **End-to-end smoke (manual / CI-optional):** `npx shadcn add` the regenerated starter into a scratch project with `shadcn init`, then `tsc` — expect zero `@zod-to-form/*` imports in the owned tree and a clean typecheck (the bug this whole effort started from).

## Non-goals

- Changing the runtime `shadcnComponentMap` (separate native-stub implementation; unaffected).
- A per-component import-source feature in codegen (the barrel re-export keeps a single `components.source`; not needed).
- Removing `@zod-to-form/core` from `z2f.config.ts` / making the project literally zero-z2f including build-time (explicitly deferred — "zero at runtime" is the chosen target; `defineConfig`'s preset-merge + inference are worth the build-time devDep).
- Teaching codegen to inline composite structure (Select/RadioGroup/DatePicker trees) — the adapter files remain the home for composition.

## Risks

- **Coercion expression extension** widens the field-expression allowlist; keep it to the specific `!!field.value` form, not arbitrary expressions, to avoid an injection surface in generated code.
- **`typesModule` multi-file output** softens the "single self-contained file" story; mitigated by making it opt-in (default stays inline).
- **Barrel re-export of raw `ui/*`** means `Checkbox`/`Switch` are now the raw Radix components; the generated `checked={!!field.value}` binding must be correct or the control silently misbehaves — covered by the parity test + e2e smoke.
- The work spans `core`, `codegen`, and `apps/docs/registry` (all published or registry-facing) → changeset required; sequence after the in-flight release of the Stage-1 parity work.

## Decisions (resolved during brainstorming)

- Ownership target = **zero z2f at runtime**; `z2f.config.ts` keeps its build-time `core` devDep.
- Collapse scope = **full Tier-3** (drop `Input`/`Textarea`/`Checkbox`/`Switch` adapter files; bind to `ui/*`).
- Checkbox/Switch coercion = **codegen emits `checked={!!field.value}`** (extend field-expression allowlist), not a `z.boolean().default()` requirement.
- `StripIndexSignature` = move to the owned **`@/components/zod-form/types.ts`** (surfaced via the barrel), **opt-in** via `typesModule` (inline remains the standalone default).
- Import surface = keep the **single barrel** (`@/components/zod-form`); no per-component source routing.

## Suggested implementation decomposition

- **Plan A (code):** core field-expression extension → codegen `typesModule` + coercion → registry barrel/types/composites/items + adapter deletions + example-form rename → regenerate → tests + parity + e2e smoke. Testable end to end.
- **Plan B (docs):** quickstart sample fix + claim-wording audit across the inventory. Prose; can land alongside or just after A.

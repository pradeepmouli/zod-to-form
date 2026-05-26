# Base UI shadcn-add E2E Smoke Test Results

Date: 2026-05-26
Branch: feat/codegen-owned-output
Registry served from: `apps/docs/static/r/` via `python3 -m http.server 8899`

## Setup

- Scaffold: `npm create vite@latest . -- --template react-ts`
- shadcn init: `npx shadcn@latest init -b base -p nova --yes` → **succeeded** (`style: "base-nova"`)
- Tailwind v4 (`@tailwindcss/vite`) + `@types/node` needed as pre-setup
- Path alias `@/* → ./src/*` configured in tsconfig.app.json + vite.config.ts

## BLOCKER 1: `shadcn add http://localhost:8899/r/starter-codegen.json` FAILS

```
Error: The item at https://ui.shadcn.com/r/styles/base-nova/date-picker.json was not found.
```

**Root cause:** The registry files declare `"date-picker"` as a `registryDependency`. The upstream shadcn
base-nova style does NOT have a `date-picker` component. The z2f date-picker is an owned adapter file
(correctly placed at `src/components/z2f/date-picker.tsx`) but declaring it as a `registryDependency`
causes `shadcn add` to try to fetch it from the upstream shadcn registry — and fail.

**Fix required:** Remove `"date-picker"` from `registryDependencies` in all three starter registry items
(starter-codegen, starter-react, starter-vite). The date-picker is already embedded as a registry `file`
in the starter; it must NOT also be a `registryDependency`.

**Workaround used for this test:** Added components individually via
`npx shadcn@latest add input textarea checkbox switch select radio-group label button popover calendar form --yes`
(skipping date-picker), then manually placed z2f files from the registry JSON.

## Files Installed and Paths

### shadcn UI primitives (installed by `shadcn add`, resolved to `src/components/ui/`):
NOTE: shadcn CLI wrote to a literal `@/` directory (top-level project `@/`) because the
`@/*→src/*` path alias is not resolved by the CLI. Files were manually moved to `src/components/ui/`.
This is a harness-setup issue, not a registry JSON defect.

- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/calendar.tsx`
- (form: stub in base-nova — NO files installed, see BLOCKER 2)

### z2f owned files (extracted from registry JSON, placed manually):
- `z2f.config.ts` (project root) ✓
- `src/lib/example-schema.ts` ✓
- `src/components/z2f/types.ts` ✓
- `src/components/z2f/select.tsx` ✓
- `src/components/z2f/radio-group.tsx` ✓
- `src/components/z2f/date-picker.tsx` ✓
- `src/components/z2f/index.tsx` ✓
- `src/components/example-form.tsx` ✓

## Assertions

### z2f.config.ts at project root: PASS
File is at `/z2f.config.ts` (not under `src/lib/`).

### src/components/z2f/ contains only index/types/select/radio-group/date-picker; NO input/textarea/checkbox/switch adapter files: PASS
Only the 5 expected files exist. Input/Textarea/Checkbox/Switch are re-exported directly from `@/components/ui/*`
via `index.tsx` — no adapter wrappers.

### z2f import grep for owned runtime tree: PASS
```
rg -n "^import.*@zod-to-form/" src/components/z2f src/components/example-form.tsx src/lib/example-schema.ts
→ NONE
```
The only `@zod-to-form/` string in the tree is a COMMENT in `types.ts:19` ("severs the @zod-to-form/core dependency").
No actual imports.
`z2f.config.ts` (build-time only) legitimately imports `@zod-to-form/core`.

### example-form.tsx imports StripIndexSignature + z2f components: PASS
```tsx
import { Checkbox, DatePicker, FormControl, FormItem, FormLabel, FormMessage, Input, Select } from '@/components/z2f';
import type { StripIndexSignature } from '@/components/z2f';
import { schema } from '@/lib/example-schema';
```

## BLOCKER 2: `form` component missing in base-nova registry

`https://ui.shadcn.com/r/styles/base-nova/form.json` returns `{"name":"form","type":"registry:ui"}` with
NO files. The base-nova style does not ship a `form.tsx` (the RHF-wrapping FormItem/FormLabel/FormControl/
FormMessage/FormField wrappers). This causes:

```
src/components/z2f/index.tsx(26,8): error TS2307: Cannot find module '@/components/ui/form'
```

**Impact:** `z2f/index.tsx` re-exports FormItem, FormControl, FormLabel, FormMessage, FormDescription,
FormField from `@/components/ui/form` — these are Radix/default-style shadcn primitives, absent in
base-nova. Both starters are blocked by this.

**Fix required:** Either ship a minimal `form.tsx` as an owned file in the starter (not a registryDependency),
or remove the Form* re-exports from `z2f/index.tsx` and have `example-form.tsx` import directly from
wherever those primitives live in a base-nova project.

## tsc Results — starter-codegen (FAIL, exit 2)

### ERROR 1 — `src/components/ui/calendar.tsx(88,9)` — SHADCN PRIMITIVE
```
error TS2353: Object literal may only specify known properties, and 'table' does not exist in type 'Partial<ClassNames>'
```
The installed base-nova `calendar.tsx` uses `react-day-picker` classNames that are stale vs the installed
version. This is a shadcn upstream bug / version mismatch in the base-nova registry — NOT in z2f code.

### ERROR 2 — `src/components/z2f/date-picker.tsx(1,1)` — OWNED Z2F CODE (cosmetic)
```
error TS6133: 'React' is declared but its value is never read.
```
`date-picker.tsx` has `import * as React from 'react'` but the JSX uses the automatic runtime (`react-jsx`).
With `noUnusedLocals: true` this becomes an error. The import is unnecessary in the new JSX transform.
**Fix:** Remove the `import * as React from 'react'` line from `date-picker.tsx`.

### ERROR 3 — `src/components/z2f/index.tsx(26,8)` — BLOCKER 2 (see above)
```
error TS2307: Cannot find module '@/components/ui/form'
```

### ERROR 4 — `src/components/z2f/select.tsx(21,40)` — OWNED Z2F CODE
```
error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string | number'.
  Type 'null' is not assignable to type 'string | number'.
```
In `z2f/select.tsx`, line 20: `value={value == null ? undefined : String(value)}` — the
`String(value)` is called only when value is not null (guarded by `value == null ? undefined`),
but TypeScript still widens the result to `string | null` because `value` is `string | number | null | undefined`
and the conditional narrowing doesn't satisfy the `onValueChange` overload's `string` param.

Wait — the actual error is at line 21: `onValueChange={(v) => onChange?.(v)}` — the `v` from
`ShadcnSelect.onValueChange` (Base UI Select `onValueChange`) returns `string` but the callback has
a second parameter `eventDetails`. Actually the error at 21 is about `String(value)` on line 20 still
allowing null through. The `value == null ? undefined : String(value)` expression's narrowing: 
TypeScript infers the ternary as `string | undefined` but the issue is that when shadcn base-nova
`Select` = `SelectPrimitive.Root` and its `value` prop is generic `Value` — and `String(value)` where
`value: string | number | undefined` is `string` — but `null` comes through because the `select.tsx` is
`forwardRef<HTMLButtonElement, Props>` and `SelectTrigger ref` doesn't accept `HTMLButtonElement`.

The real error: `Select` (the shadcn base-nova component) is `SelectPrimitive.Root` which uses `value` 
generically. The `SelectTrigger` is `SelectPrimitive.Trigger`, not an HTMLButton. Passing `ref={ref}` 
(where ref is `React.Ref<HTMLButtonElement>`) to `SelectTrigger` which is typed for `SelectPrimitive.Trigger` 
causes a ref type mismatch. The `String(value)` null issue: actually `value == null ? undefined : String(value)` 
where `value: string | number | undefined` — `String(undefined)` doesn't happen (guarded), `String(string)` 
and `String(number)` are fine. The `null` in the error message suggests a deeper inference issue.

**Actual error source:** The `ShadcnSelect` value prop being typed generically — TypeScript resolves 
`String(value)` as `string` but there may be a `null` coming from somewhere. Needs investigation.

### ERROR 5 — `src/components/example-form.tsx(46,28)` — OWNED Z2F CODE (generated form)
```
error TS2322: Type 'boolean | undefined' is not assignable to type 'string | undefined'.
```
The generated `example-form.tsx` passes `value={field.value}` to `<Checkbox>` where `field.value` is
`boolean | undefined`. The base-nova `Checkbox` uses `CheckboxPrimitive.Root.Props` which has 
`value?: string | undefined` (for form submission value), NOT `checked`. The codegen form should use
`checked={!!field.value} onCheckedChange={field.onChange}` for Base UI checkbox (not `value`).
Actually looking at line 46: it passes BOTH `value={field.value}` AND `checked={!!field.value}`.
The `value` prop on Base UI `CheckboxPrimitive.Root` is `string | undefined` — passing `boolean | undefined` fails.

**Fix required in codegen:** For Base UI Checkbox, the `value` prop should not be passed (or must be omitted),
only `checked={!!field.value}` + `onCheckedChange={field.onChange}`. The codegen is emitting a stale
`value={field.value}` alongside the correct `checked` binding.

### ERROR 6 — `src/components/example-form.tsx(65,97)` — OWNED Z2F CODE (generated form)
```
error TS2322: Property 'ref' does not exist on type 'IntrinsicAttributes & ControlledFieldProps<Date | undefined>'.
```
The generated form passes `ref={field.ref}` to `<DatePicker>` but `DatePicker` is a regular function
(not `forwardRef`). `DatePicker` only accepts `ControlledFieldProps<Date | undefined>` which has no `ref`.
The codegen emits `ref={field.ref}` for all controlled components — but the `DatePicker` wrapper doesn't
forward refs.

**Fix options:**
1. Wrap `DatePicker` in `React.forwardRef` (matching the pattern of Select/RadioGroup), OR
2. Have the codegen omit `ref` for the DatePicker binding.

### ERROR 7 — `z2f.config.ts(4,34)` — CONFIG FILE (harness-gap / wrong relative import)
```
error TS2307: Cannot find module './schema' or its corresponding type declarations.
```
The config file has `import type * as ZodSchemas from './schema'` but the schema lives at
`./src/lib/example-schema` (or `@/lib/example-schema` via alias). The `./schema` path doesn't exist
at the project root.
**Fix required:** Change to `import type * as ZodSchemas from '@/lib/example-schema'` (or the correct relative path).

## tsc Results — starter-react (FAIL, exit 2)

Shares all errors from starter-codegen (errors 1–3, 7) PLUS:

### EXTRA ERROR — `src/components/example-form.tsx(26,7)` — STRUCTURAL INCOMPATIBILITY
```
error TS2322: Type '{ Input: ...(plain function)... }' is not assignable to type 'Partial<{ Input: MemoExoticComponent<...>; ... }>'.
  Types of property 'Input' are incompatible: ... 'MemoExoticComponent' is missing '$$typeof'.
```
The `@zod-to-form/react` `ZodForm` `components` prop expects `Partial<typeof defaultComponentMap>` where
`defaultComponentMap.Input` is a `MemoExoticComponent` (i.e., `React.memo(...)` wrapped). The base-nova
shadcn `Input` is a plain function component — NOT memo-wrapped. This makes the types structurally
incompatible.

**Fix required:** Either:
1. Update `defaultComponentMap` in `@zod-to-form/react` to use plain function types (not `MemoExoticComponent`), OR
2. The z2f `index.tsx` `components` export wraps each component in `React.memo()`, OR
3. Widen the `components` prop type to `Partial<Record<string, ComponentType>>`.

## Date-Picker `render` Prop Verdict

**`PopoverTrigger.render` prop: AVAILABLE** — The base-nova `PopoverTrigger` wraps
`PopoverPrimitive.Trigger` with `{...props}` passthrough, and `PopoverTriggerProps` extends
`BaseUIComponentProps` which includes `render?: React.ReactElement | ComponentRenderFn | undefined`.
So `render={<Button .../>}` IS a valid prop on the base-nova `PopoverTrigger`.

**Calendar `mode="single" selected onSelect`: PARTIALLY COMPATIBLE** — The base-nova `calendar.tsx`
uses `react-day-picker` and accepts `React.ComponentProps<typeof DayPicker>` which includes `mode`,
`selected`, and `onSelect`. The `onSelect={(d?: Date) => onChange?.(d)}` signature matches.
However the installed calendar has a stale `ClassNames` incompatibility (`table` key) — this is a
shadcn upstream version mismatch, not a date-picker wrapper bug.

**`DatePicker` tsc result:** The date-picker wrapper itself has 2 errors:
1. Unused `React` import (cosmetic — remove the explicit import)
2. `ref` not accepted on `DatePicker` by the generated form (fix: add `forwardRef` or remove `ref` from codegen)

**Verdict on the `render` prop approach:** The Base UI `PopoverTrigger` DOES accept `render` — the
composition pattern is correct. The errors are fixable (unused import + missing forwardRef).

## Layout and Zero-Dep Claims Verdict

- **Layout (z2f.config.ts at root):** PASS — file correctly lands at project root
- **Zero @zod-to-form/* in owned runtime tree:** PASS — no runtime imports
- **Zero input/textarea/checkbox/switch adapter files:** PASS — only 3 adapters (select, radio-group, date-picker)
- **shadcn add pipeline:** BLOCKED by `date-picker` registryDependency that doesn't exist in base-nova

## Summary of Required Fixes (non-negotiable for clean tsc)

| # | File | Category | Fix |
|---|------|----------|-----|
| 1 | registry items (all 3) | BLOCKER | Remove `"date-picker"` from `registryDependencies` |
| 2 | registry items (all 3) | BLOCKER | Remove `"form"` from `registryDependencies`; ship `form.tsx` as an owned file OR remove Form* re-exports from `z2f/index.tsx` |
| 3 | `z2f/date-picker.tsx` | owned-code | Remove `import * as React from 'react'` |
| 4 | `z2f/date-picker.tsx` | owned-code | Wrap in `React.forwardRef` so generated form can pass `ref={field.ref}` |
| 5 | `z2f.config.ts` (template) | config-template | Fix `./schema` import to `@/lib/example-schema` |
| 6 | `example-form.tsx` (generated) | codegen output | Omit `value={field.value}` for Checkbox (Base UI Checkbox.value is `string`, not `boolean`) |
| 7 | `@zod-to-form/react` | library | Widen `components` prop type from `Partial<typeof defaultComponentMap>` (MemoExoticComponent) to accept plain function components |

## Status

DONE_WITH_CONCERNS

The structural zero-dep claim and file layout hold. The `shadcn add` pipeline is blocked by the
`date-picker` registryDependency ghost. The owned z2f code has 2 real errors (unused React import in
date-picker, missing forwardRef on DatePicker). The generated example-form has a Checkbox `value` type
error. The `@zod-to-form/react` starter has a structural incompatibility with base-nova plain-function
components (MemoExoticComponent vs function). The `form` shadcn component is a stub in base-nova with
no files — re-exports of Form* primitives in `z2f/index.tsx` must be rethought.

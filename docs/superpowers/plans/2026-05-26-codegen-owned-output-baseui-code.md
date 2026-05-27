# Codegen Owned-Output (Base UI) — Plan A: Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make z2f codegen output genuinely zero-`@zod-to-form/*` at runtime, slim the shadcn registry to Select/RadioGroup (+ thin date wrapper) adapters bound against shadcn's **Base UI** components, route date fields by schema type, and relayout the ejected files (root `z2f.config.ts`, `@/components/z2f/`, neutral `example-*` samples).

**Architecture:** Three layers change. **core** (`@zod-to-form/core`): widen the codegen field-expression allowlist with `!!field.value`; route `z.string().date()/.time()/.datetime()` to native input `type` instead of the `DatePicker` component. **codegen** (`@zod-to-form/codegen`): add an opt-in `typesModule` config knob that imports `StripIndexSignature` instead of inlining it. **registry** (`apps/docs/registry`): relayout paths/targets, inline `FormFieldOption`+`StripIndexSignature` into an owned `types.ts`, delete the Input/Textarea/Checkbox/Switch adapters (bind flat to re-exported Base UI `ui/*`), keep Select/RadioGroup adapters, add a thin Date-only `date-picker` wrapper, rewrite `ADAPTER_OVERRIDES` to the Base UI prop shape, move config to root, drop the vite `configPath`, regenerate.

**Tech Stack:** TypeScript 5 (strict), Zod v4, React Hook Form 7, Vitest, pnpm workspaces, oxlint/oxfmt, shadcn CLI + Base UI 1.5.x, react-day-picker (via shadcn Calendar), tsx (registry build).

**Spec:** `docs/superpowers/specs/2026-05-26-codegen-owned-output-baseui-design.md`

**Sequencing:** Execute **after** the Stage-1 parity release (PR #131 "version packages") is cut, to avoid changeset/version conflicts. This plan adds its own changeset (Task 14) on top of the released baseline.

**Branch:** `feat/codegen-owned-output`. **Do not modify** `.claude/settings.json` or `apps/playground/src/hooks/usePlaygroundState.ts`.

---

### Task 0: Verify shadcn Base UI component shapes (resolve spec open items)

This task is **read/record only** — no production code. It resolves the spec's "Open items" so later tasks bind against real APIs, not assumptions. Record findings in a scratch note committed under the plan dir.

**Files:**
- Create (scratch, committed): `docs/superpowers/plans/notes/baseui-component-shapes.md`

- [ ] **Step 1: Scaffold a Base UI scratch project**

Run:
```bash
cd /tmp && rm -rf z2f-baseui-probe && mkdir z2f-baseui-probe && cd z2f-baseui-probe
npm create vite@latest . -- --template react-ts
npx shadcn@latest init   # choose the Base UI / "base" style when prompted
```
Expected: a `components.json` with the base style; `@/components/ui` alias configured.

- [ ] **Step 2: Add the components the registry will depend on**

Run:
```bash
npx shadcn@latest add input textarea checkbox switch select radio-group label button popover calendar date-picker form
```
Expected: files land in `src/components/ui/*`.

- [ ] **Step 3: Record exact shapes into the notes file**

For each of `checkbox.tsx`, `switch.tsx`, `select.tsx`, `radio-group.tsx`, `date-picker.tsx`, `calendar.tsx`, open the file and record into `baseui-component-shapes.md`:
- The exported component names (confirm `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`; `RadioGroup`/`RadioGroupItem`; `Checkbox`; `Switch`).
- Checkbox/Switch: the controlled prop names (`checked`, `onCheckedChange`) and the callback's first-arg type; whether the focusable input is reached via `inputRef` or root `ref`.
- Select/RadioGroup: the controlled props (`value`, `onValueChange`) and the callback signature (value-first?); whether an `items` prop exists and whether it auto-renders.
- date-picker: whether it's self-stateful (`useState<Date>`) or accepts controlled `value`/`onChange`; the Calendar props it uses (`mode`, `selected`, `onSelect`).

- [ ] **Step 4: Commit the notes**

```bash
git add docs/superpowers/plans/notes/baseui-component-shapes.md
git commit -m "docs(plan): record shadcn Base UI component shapes for owned-output migration"
```

**Acceptance:** the notes file states, for each component, the exact prop names later tasks rely on. If any differ from the spec's assumptions (e.g. Select export names, date-picker controllability), STOP and reconcile with the human before proceeding — the spec's §1/§5/§8 assume the documented Base UI shapes.

---

### Task 1: core — add `!!field.value` to the field-expression allowlist

**Files:**
- Modify: `packages/core/src/config.ts` (the `RHF_FIELD_EXPRESSIONS` set and its emit/resolution)
- Test: `packages/core/tests/field-expressions.test.ts` (create if absent; else extend the existing field-expression test)

- [ ] **Step 1: Locate the allowlist**

Run: `rg -n "RHF_FIELD_EXPRESSIONS" packages/core/src`
Read the definition and how a recognized string maps to an emitted JSX expression (codegen wraps it in `{…}`). Confirm `'field.value'` and `'field.onChange'` are present.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { RHF_FIELD_EXPRESSIONS } from '../src/config.js';

describe('RHF_FIELD_EXPRESSIONS', () => {
  it('recognizes the boolean coercion expression', () => {
    expect(RHF_FIELD_EXPRESSIONS.has('!!field.value')).toBe(true);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `pnpm --filter @zod-to-form/core test -- field-expressions`
Expected: FAIL (`'!!field.value'` not in the set).

- [ ] **Step 4: Add the entry**

Add `'!!field.value'` to the `RHF_FIELD_EXPRESSIONS` set. If the set maps expression-string → emitted-code, map `'!!field.value'` so codegen emits `{!!field.value}` (mirror how `'field.value'` → `{field.value}`). Add a one-line comment: `// boolean coercion: guards undefined→false for controlled checkbox/switch`.

- [ ] **Step 5: Run the test to confirm pass + full core suite**

Run: `pnpm --filter @zod-to-form/core test`
Expected: PASS, no regressions.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/config.ts packages/core/tests/field-expressions.test.ts
git commit -m "feat(core): allow !!field.value coercion expression for controlled boolean bindings"
```

---

### Task 2: core walker — route string date/time/datetime formats to native input `type`

**Files:**
- Modify: `packages/core/src/processors/string.ts` (`DATE_PICKER_FORMATS`, `FORMAT_TO_INPUT_TYPE`, the `field.component`/`field.props.type` assignment around the date-like branch)
- Test: `packages/core/tests/processors/string.test.ts` (extend; create if absent)

- [ ] **Step 1: Read current routing**

Run: `rg -n "DATE_PICKER_FORMATS|FORMAT_TO_INPUT_TYPE|DatePicker|isDateLike|component =" packages/core/src/processors/string.ts`
Confirm today date-like formats set `field.component = 'DatePicker'`.

- [ ] **Step 2: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '../../src/index.js';

describe('string date formats route to native inputs', () => {
  it('z.string().date() → Input type=date', () => {
    const f = walkSchema(z.object({ d: z.string().date() }))[0];
    expect(f.component).toBe('Input');
    expect(f.props.type).toBe('date');
  });
  it('z.string().time() → Input type=time', () => {
    const f = walkSchema(z.object({ t: z.string().time() }))[0];
    expect(f.component).toBe('Input');
    expect(f.props.type).toBe('time');
  });
  it('z.string().datetime() → Input type=datetime-local', () => {
    const f = walkSchema(z.object({ dt: z.string().datetime() }))[0];
    expect(f.component).toBe('Input');
    expect(f.props.type).toBe('datetime-local');
  });
});
```

- [ ] **Step 3: Run to confirm fail**

Run: `pnpm --filter @zod-to-form/core test -- string`
Expected: FAIL (component is currently `'DatePicker'`).

- [ ] **Step 4: Implement the routing change**

In `string.ts`: for date-like string formats, set `field.props.type` to the mapped native type (`date`/`time`/`datetime-local`) and **keep `field.component = 'Input'`** (do not set `'DatePicker'`). Ensure `FORMAT_TO_INPUT_TYPE` covers `date→'date'`, `time→'time'`, `datetime→'datetime-local'` (+ `datetime-local` aliasing). Remove the `isDateLike → 'DatePicker'` branch for strings.

- [ ] **Step 5: Confirm `z.date()` still routes to DatePicker**

Add and run:
```ts
it('z.date() still routes to DatePicker', () => {
  const f = walkSchema(z.object({ when: z.date() }))[0];
  expect(f.component).toBe('DatePicker');
});
```
Read the date/`z.date()` processor (`rg -n "DatePicker|date" packages/core/src/processors/*.ts`) and confirm the Date-object processor still sets `'DatePicker'`. Adjust only if the string change leaked into it.

- [ ] **Step 6: Run core suite (expect known snapshot/date breakages elsewhere)**

Run: `pnpm --filter @zod-to-form/core test`
Any failing tests that asserted the OLD string-date→DatePicker behavior must be **updated to the new native-input routing** (this is a deliberate behavior change). Do NOT weaken assertions to hide it. Run `pnpm --filter @zod-to-form/react test` and `pnpm --filter @zod-to-form/codegen test` and update any date-routing snapshots the same way.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/processors/string.ts packages/core/tests
git commit -m "feat(core): route string date/time/datetime to native input type, reserve DatePicker for z.date()"
```

---

### Task 3: codegen — opt-in `typesModule` (import `StripIndexSignature` vs inline)

**Files:**
- Modify: `packages/codegen/src/templates.ts` (the `StripIndexSignature` inline block + header imports)
- Modify: `packages/codegen/src/generate.ts` (thread the `typesModule` option through `generateFormComponent`)
- Modify: codegen config type (find via `rg -n "CodegenConfig|GenerateOptions|exportName" packages/codegen/src packages/core/src`) — add optional `typesModule?: string`
- Test: `packages/codegen/tests/types-module.test.ts` (create)

- [ ] **Step 1: Find the inline block and the options type**

Run: `rg -n "StripIndexSignature" packages/codegen/src` and `rg -n "typesModule|interface .*Options|type .*Options" packages/codegen/src packages/core/src`
Record the option type's location and the function signature of `generateFormComponent`.

- [ ] **Step 2: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { walkSchema } from '@zod-to-form/core';
import { generateFormComponent } from '../src/index.js';
import { z } from 'zod';

const fields = walkSchema(z.object({ name: z.string() }));
const base = { exportName: 'schema', componentName: 'F', mode: 'submit', ui: 'html' } as const;

describe('typesModule', () => {
  it('imports StripIndexSignature when typesModule is set', () => {
    const out = generateFormComponent(fields, { ...base, typesModule: '@/components/z2f' });
    expect(out).toContain("import type { StripIndexSignature } from '@/components/z2f';");
    expect(out).not.toContain('type StripIndexSignature<T>');
  });
  it('inlines StripIndexSignature when typesModule is absent', () => {
    const out = generateFormComponent(fields, { ...base });
    expect(out).toContain('type StripIndexSignature<T>');
    expect(out).not.toContain("import type { StripIndexSignature }");
  });
});
```

- [ ] **Step 3: Run to confirm fail**

Run: `pnpm --filter @zod-to-form/codegen test -- types-module`
Expected: FAIL (`typesModule` not a recognized option).

- [ ] **Step 4: Implement**

Add `typesModule?: string` to the codegen options type. In `templates.ts`, where the `StripIndexSignature<T>` block is composed: when `typesModule` is set, emit `import type { StripIndexSignature } from '${typesModule}';` in the header and OMIT the inline block; otherwise keep the inline block and no import. Thread the option from `generateFormComponent` (generate.ts) into the template builder.

- [ ] **Step 5: Run to confirm pass + full codegen suite**

Run: `pnpm --filter @zod-to-form/codegen test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src packages/codegen/tests/types-module.test.ts
git commit -m "feat(codegen): opt-in typesModule to import StripIndexSignature instead of inlining"
```

---

### Task 4: codegen — verify controlled boolean binding emits the coercion

This is a guard test (the mechanics already exist via Task 1's allowlist + the existing override-prop emit path). No new source unless it fails.

**Files:**
- Test: `packages/codegen/tests/controlled-boolean.test.ts` (create)

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from 'vitest';
import { generateFormComponent } from '../src/index.js';
import type { FormField } from '@zod-to-form/core';

const field: FormField = {
  key: 'agree', component: 'Checkbox', zodType: 'boolean',
  props: {}, label: 'Agree', required: false, readOnly: false,
  hidden: false, disabled: false, deprecated: false, constraints: {}
};

describe('controlled boolean binding (Base UI shape)', () => {
  it('emits checked={!!field.value} onCheckedChange={field.onChange}', () => {
    const out = generateFormComponent([field], {
      exportName: 'schema', componentName: 'F', mode: 'submit', ui: 'shadcn',
      componentConfig: {
        components: { source: '@/components/z2f' },
        overrides: { Checkbox: { controlled: true, props: { checked: '!!field.value', onCheckedChange: 'field.onChange' } } }
      }
    } as any);
    expect(out).toContain('checked={!!field.value}');
    expect(out).toContain('onCheckedChange={field.onChange}');
    expect(out).not.toContain('=== true'); // no Radix-era normalization
  });
});
```

- [ ] **Step 2: Run**

Run: `pnpm --filter @zod-to-form/codegen test -- controlled-boolean`
Expected: PASS (Task 1 enabled `!!field.value`; the override-prop path emits the rest). If it FAILS because `!!field.value` isn't emitted as `{!!field.value}`, fix the emit mapping in `config.ts`/codegen (return to Task 1 Step 4) — do not weaken the test.

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/tests/controlled-boolean.test.ts
git commit -m "test(codegen): controlled boolean binds checked={!!field.value} with no normalization"
```

---

### Task 5: registry — inline `FormFieldOption` + `StripIndexSignature` into owned `types.ts`

**Files:**
- Modify: `apps/docs/registry/components/shadcn/types.ts`

- [ ] **Step 1: Read current types.ts**

Run: `cat apps/docs/registry/components/shadcn/types.ts`
Confirm `ControlledFieldProps` is local; note the `@zod-to-form/core` `FormFieldOption` import in `select.tsx`/`radio-group.tsx`.

- [ ] **Step 2: Add the two owned types**

Append to `types.ts`:
```ts
/** Owned copy of the option shape (severs the @zod-to-form/core dependency). */
export interface FormFieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

/** Strips index signatures from an inferred Zod type (mirrors codegen's inline util). */
export type StripIndexSignature<T> = T extends Date | File | FileList | Blob | RegExp
  ? T
  : T extends readonly (infer U)[]
    ? StripIndexSignature<U>[]
    : T extends object
      ? {
          [K in keyof T as string extends K
            ? never
            : number extends K
              ? never
              : symbol extends K
                ? never
                : K]: StripIndexSignature<T[K]>;
        }
      : T;
```
(Copy the `StripIndexSignature` body verbatim from `packages/codegen/src/templates.ts` to guarantee it matches what codegen would have inlined — verify with `rg -n -A18 "type StripIndexSignature" packages/codegen/src/templates.ts`.)

- [ ] **Step 3: Typecheck the registry build package**

Run: `pnpm --filter @zod-to-form/shadcn-registry... run type-check 2>/dev/null || npx tsc --noEmit -p apps/docs/registry`
Expected: clean (these are type-only additions).

- [ ] **Step 4: Commit**

```bash
git add apps/docs/registry/components/shadcn/types.ts
git commit -m "feat(registry): inline FormFieldOption + StripIndexSignature into owned types.ts"
```

---

### Task 6: registry — swap `FormFieldOption` import in Select/RadioGroup; confirm Base UI composition

**Files:**
- Modify: `apps/docs/registry/components/shadcn/select.tsx`
- Modify: `apps/docs/registry/components/shadcn/radio-group.tsx`

- [ ] **Step 1: Swap the import**

In both files, change `import type { FormFieldOption } from '@zod-to-form/core';` → `import type { FormFieldOption } from './types.js';`.

- [ ] **Step 2: Confirm Base UI prop compatibility (per Task 0 notes)**

Verify the adapters compose against the Base UI export names recorded in Task 0 (`Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`; `RadioGroup`/`RadioGroupItem`) and that the internal `onValueChange={(v) => onChange?.(v)}` mapping discards the Base UI callback's second arg via the closure. If export names differ, update the imports to match the Task 0 findings. No structural rewrite expected.

- [ ] **Step 3: Guard test — no z2f import remains**

Add `apps/docs/registry/components/shadcn/__tests__/no-z2f-import.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

describe('shipped adapters carry zero @zod-to-form imports', () => {
  const dir = join(__dirname, '..');
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.tsx') || (n.endsWith('.ts') && n !== 'types.ts'))) {
    it(`${f} has no @zod-to-form import`, () => {
      expect(readFileSync(join(dir, f), 'utf8')).not.toMatch(/@zod-to-form\//);
    });
  }
});
```

- [ ] **Step 4: Run the adapter tests**

Run: `pnpm --filter @zod-to-form/shadcn-registry... test 2>/dev/null || (cd apps/docs/registry && npx vitest run)`
Expected: PASS (the swap + guard).

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry/components/shadcn/select.tsx apps/docs/registry/components/shadcn/radio-group.tsx apps/docs/registry/components/shadcn/__tests__/no-z2f-import.test.ts
git commit -m "refactor(registry): source FormFieldOption locally; guard zero z2f imports in adapters"
```

---

### Task 7: registry — thin Date-only `date-picker` wrapper (Base UI)

**Files:**
- Modify: `apps/docs/registry/components/shadcn/date-picker.tsx` (rewrite per Task 0 findings)

- [ ] **Step 1: Rewrite as a controlled, parsing-free wrapper**

Using the Base UI shapes from Task 0, rewrite `date-picker.tsx` to expose `ControlledFieldProps<Date | undefined>` and bridge to the shadcn Base UI Popover + Calendar — `selected={value} onSelect={onChange}` — with **no string parsing** (Date in, Date out). Base the structure on the Task 0 `date-picker.tsx` recording; keep only trigger-label formatting (via the shadcn Calendar's own formatter or `date-fns`). Example skeleton (adapt prop names to Task 0 findings):
```tsx
import * as React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { ControlledFieldProps } from './types.js';

export function DatePicker({ value, onChange, name, disabled, id }: ControlledFieldProps<Date | undefined>) {
  const selected = value instanceof Date && !Number.isNaN(value.getTime()) ? value : undefined;
  return (
    <Popover>
      <PopoverTrigger render={<Button type="button" variant="outline" id={id} name={name} disabled={disabled} />}>
        {selected ? format(selected, 'PPP') : 'Pick a date'}
      </PopoverTrigger>
      <PopoverContent>
        <Calendar mode="single" selected={selected} onSelect={(d?: Date) => onChange?.(d)} />
      </PopoverContent>
    </Popover>
  );
}
```
(Note: Base UI uses a `render` prop rather than Radix `asChild` — confirm against Task 0. This wrapper handles ONLY `z.date()` fields; string dates go to native inputs via Task 2.)

- [ ] **Step 2: Confirm zero z2f import + typecheck**

Run the guard test from Task 6 + `npx tsc --noEmit -p apps/docs/registry` (or the registry's type-check). Expected: no `@zod-to-form/*` import; clean types.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/registry/components/shadcn/date-picker.tsx
git commit -m "refactor(registry): date-picker becomes a thin Date-only controlled Base UI wrapper"
```

---

### Task 8: registry — barrel re-exports + delete passthrough adapters

**Files:**
- Modify: `apps/docs/registry/components/shadcn/index.tsx`
- Delete: `apps/docs/registry/components/shadcn/input.tsx`, `textarea.tsx`, `checkbox.tsx`, `switch.tsx`

- [ ] **Step 1: Rewrite the barrel**

Set `index.tsx` to:
```tsx
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Checkbox } from '@/components/ui/checkbox';
export { Switch } from '@/components/ui/switch';
export { Select } from './select.js';
export { RadioGroup } from './radio-group.js';
export { DatePicker } from './date-picker.js';
export { FormItem, FormControl, FormLabel, FormMessage, FormDescription, FormField } from '@/components/ui/form';
export type { StripIndexSignature, FormFieldOption, ControlledFieldProps } from './types.js';
```
Remove any `components` map entries for the deleted adapters if the barrel still exports a map (keep only shipped components).

- [ ] **Step 2: Delete the passthrough adapter files**

```bash
git rm apps/docs/registry/components/shadcn/input.tsx apps/docs/registry/components/shadcn/textarea.tsx apps/docs/registry/components/shadcn/checkbox.tsx apps/docs/registry/components/shadcn/switch.tsx
```
Delete or update any fixtures/tests referencing them (`rg -ln "input.tsx|textarea.tsx|checkbox.tsx|switch.tsx|ShadcnInput|ShadcnCheckbox" apps/docs/registry`).

- [ ] **Step 3: Typecheck + adapter tests**

Run the registry type-check + tests. Expected: clean; the guard test still passes.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/registry/components/shadcn/index.tsx
git commit -m "refactor(registry): barrel re-exports Base UI ui/* primitives; delete passthrough adapters"
```

---

### Task 9: registry — relayout items.ts (paths/targets, root config, overrides, typesModule, deps, vite configPath)

**Files:**
- Modify: `apps/docs/registry/build/items.ts`

- [ ] **Step 1: Update the adapter component-name list**

Find `ADAPTER_COMPONENT_NAMES` (or equivalent) and set it to `['select', 'radio-group', 'date-picker']`.

- [ ] **Step 2: Rewrite `ADAPTER_OVERRIDES` to the Base UI shape**

```ts
const ADAPTER_OVERRIDES = {
  Input: {},
  Textarea: {},
  Checkbox: { controlled: true, props: { checked: '!!field.value', onCheckedChange: 'field.onChange' } },
  Switch:   { controlled: true, props: { checked: '!!field.value', onCheckedChange: 'field.onChange' } },
  Select:      { controlled: true },
  RadioGroup:  { controlled: true },
  DatePicker:  { controlled: true }
} as const;
```

- [ ] **Step 3: Rewrite all file `path`/`target`s to the new layout**

Apply the spec §7 table: barrel/types/select/radio-group/date-picker → `@components/z2f/…`; sample schema → `@lib/example-schema.ts`; config → root `z2f.config.ts` (no alias prefix); example/generated form files → `@components/example-form.tsx`. Update `ZOD_FORM_USAGE` and any inlined file bodies so their imports use `@/components/z2f` and `@/lib/example-schema`.

- [ ] **Step 4: Set `typesModule` and move config to root**

In the codegen + vite starter config emission, set `typesModule: '@/components/z2f'`. Change the `z2f.config.ts` file target to project root and **remove the `configPath` argument** from `VITE_USAGE` (the vite plugin auto-discovers root config).

- [ ] **Step 5: Update `registryDependencies` + sample schema**

Ensure the shadcn deps resolve to the **base** style; add the Base UI `date-picker` dep for the `z.date()` case (native-date fields need no dep). Make the sample schema (`apps/docs/registry/sample/schema.ts`) exercise: a string field, a number, a boolean (checkbox), an enum (select), a `z.string().date()` (native input), and a `z.date()` (date-picker wrapper).

- [ ] **Step 6: Build the registry package + typecheck**

Run: `pnpm --filter @zod-to-form/core build && npx tsc --noEmit -p apps/docs/registry`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/registry/build/items.ts apps/docs/registry/sample/schema.ts
git commit -m "feat(registry): relayout to @components/z2f + root config, Base UI overrides, typesModule, date routing"
```

---

### Task 10: regenerate the registry + freshness check

**Files:**
- Modify (generated): `apps/docs/static/r/*.json`

- [ ] **Step 1: Build core/codegen, then regenerate**

Run:
```bash
pnpm run build
pnpm registry:build
```

- [ ] **Step 2: Inspect the regenerated codegen starter**

Run: `cat apps/docs/static/r/starter-codegen.json | python3 -c "import sys,json;d=json.load(sys.stdin);print('\n'.join(f['content'] for f in d['files'] if f.get('content') and 'example-form' in f.get('target','')))"`
Confirm: zero `@zod-to-form/*` imports; `StripIndexSignature` imported from `@/components/z2f`; checkbox emits `checked={!!field.value} onCheckedChange={field.onChange}`; a `z.string().date()` field emits `<Input type="date" {...register(...)} />`; `z.date()` uses the DatePicker wrapper.

- [ ] **Step 3: Freshness check**

Run: `pnpm registry:check`
Expected: exit 0 (regenerated output matches committed).

- [ ] **Step 4: Commit**

```bash
git add apps/docs/static/r/
git commit -m "chore(registry): regenerate starters for Base UI owned-output layout"
```

---

### Task 11: extend the parity harness (controlled boolean + string-date)

**Files:**
- Modify: `packages/codegen/tests/parity.test.ts`

- [ ] **Step 1: Add parity assertions**

Extend the schema with a `z.boolean()` (mapped to Checkbox via shadcn overrides) and a `z.string().date()`. Assert codegen materializes `checked={!!field.value}` for the boolean and `type="date"` on the native input for the string-date field — both as hardcoded literal checks (not derived from resolvers), so a regression fails.

- [ ] **Step 2: Run**

Run: `pnpm --filter @zod-to-form/codegen test -- parity`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/tests/parity.test.ts
git commit -m "test(parity): cover controlled boolean coercion + native string-date routing"
```

---

### Task 12: end-to-end smoke (manual gate)

Not an automated test in CI by default; run locally to validate the real `npx shadcn add` path. Record the result in the PR description.

- [ ] **Step 1: Scratch Base UI project + add the regenerated starter**

Serve the regenerated registry locally (or point at the deployed `/r/` after merge) and run, in a fresh Base UI shadcn project:
```bash
npx shadcn@latest add <local-or-prod-url>/r/starter-codegen.json --yes
```

- [ ] **Step 2: Install deps + tsc**

Install the listed deps (+ react/@types/react), create `src/lib/utils.ts` if `shadcn init` didn't, then `npx tsc --noEmit`.
Expected: zero `@zod-to-form/*` imports anywhere in the owned tree (grep to confirm); files at the new layout (root `z2f.config.ts`, `@/components/z2f/`, `@/lib/example-schema.ts`); clean typecheck.

- [ ] **Step 2b: Record outcome** in the PR description (this is the bug this effort started from).

---

### Task 13: full validation sweep

- [ ] **Step 1: Run everything**

```bash
pnpm run build
pnpm run type-check
pnpm run lint
pnpm run format:check
pnpm -r run test
pnpm registry:check
```
Expected: all green. Fix any stale codegen-output assertions across `cli`/`vite`/`core` caused by the date-routing + layout changes (update to the new output; do not weaken).

- [ ] **Step 2: Commit any test updates**

```bash
git add -A
git commit -m "test: update assertions for Base UI owned-output codegen changes"
```

---

### Task 14: changeset

**Files:**
- Create: `.changeset/codegen-owned-output-baseui.md`

- [ ] **Step 1: Write the changeset**

```markdown
---
"@zod-to-form/core": minor
"@zod-to-form/codegen": minor
---

Codegen output is now genuinely free of any `@zod-to-form/*` runtime dependency. The shadcn registry targets shadcn's Base UI components, inlines `FormFieldOption`/`StripIndexSignature` into an owned `types.ts`, and slims the adapter layer to `Select`/`RadioGroup` (+ a thin Date-only date-picker wrapper). String `date`/`time`/`datetime` schemas now render as native inputs (`<input type="date|time|datetime-local">`); `z.date()` uses the Base UI date-picker. New opt-in codegen `typesModule` imports `StripIndexSignature` from an owned module instead of inlining it. The ejected layout is reorganized: `z2f.config.ts` at the project root, `@/components/z2f/` for the integration layer, neutral `@/lib/example-schema.ts` + `@/components/example-form.tsx` samples.
```

- [ ] **Step 2: Commit**

```bash
git add .changeset/codegen-owned-output-baseui.md
git commit -m "chore: changeset for Base UI owned-output codegen"
```

---

## Notes for the implementer

- **Sequencing:** start only after PR #131 (version packages) merges, so this plan's changeset and the released versions don't collide.
- **Behavior change:** string-date fields render as native date inputs now (not the popup calendar). This is intentional (spec §5) — update, don't suppress, any test that asserted the old behavior.
- **Base UI `render` vs Radix `asChild`:** Base UI components use a `render` prop where Radix used `asChild`. Task 0's recordings are authoritative; adjust the date-picker wrapper accordingly.
- **Do not touch** core's `SHADCN_OVERRIDES` (shared with the runtime native-stub preset) — Base UI override shapes live only in the registry's `ADAPTER_OVERRIDES`.

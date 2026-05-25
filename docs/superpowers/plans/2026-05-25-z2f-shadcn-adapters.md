# z2f shadcn Adapter Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a core set of owned shadcn adapter components (Input, Textarea, Checkbox, Switch, Select, RadioGroup, DatePicker) that bridge z2f's field-component contract to the consumer's installed shadcn `@/components/ui/*`, referenced by all three registry starters' config `source`, so generated forms are idiomatic shadcn.

**Architecture:** Adapter `.tsx` files live in `apps/docs/registry/components/shadcn/` (source of truth). Each takes z2f's props — RHF `register` spread for uncontrolled fields, or `ControllerRenderProps` (`{value,onChange,onBlur,name,ref,disabled}`) + `options` for controlled — and renders the shadcn component, bridging to its API. An `index.tsx` re-exports named components + a `components` map. The three registry items ship these files (target `@components/zod-form/…`) and point `components.source` at `@/components/zod-form`. Because the adapter source imports the consumer's `@/components/ui/*` (absent in this repo), local **stub fixtures** + a tsconfig path alias make the source typecheck + render-test here; the shipped file content is the verbatim source.

**Tech Stack:** TypeScript (strict), React 18+, react-hook-form, Vitest + jsdom + @testing-library/react (existing react test setup), shadcn/ui component APIs (Radix-based).

**Spec:** `docs/superpowers/specs/2026-05-25-z2f-shadcn-adapter-components-design.md`

---

## Key contracts (confirmed from the codebase)

- Controlled components receive `ControllerRenderProps`: `{ name, value, onChange, onBlur, ref, disabled }` plus `options?: FormFieldOption[]` (from `@zod-to-form/core`) and base props (`id`, aria). Same shape at runtime (`FieldRenderer` `ControlledFieldInner`) and in codegen output (`<Controller render={({ field }) => <Comp {...field} options={…} />}>`).
- `onChange(value)` accepts the new value directly (RHF). `value` is the current field value.
- Uncontrolled (Input/Textarea) receive `register(name, opts)` spread (`name/onChange/onBlur/ref`) — pass straight to the shadcn component.
- `FormFieldOption` = `{ value: string | number; label: string; disabled?: boolean }`.

## File Structure

- `apps/docs/registry/components/shadcn/input.tsx` … `date-picker.tsx` — one adapter per field type.
- `apps/docs/registry/components/shadcn/index.tsx` — named re-exports + `components` map.
- `apps/docs/registry/components/shadcn/__fixtures__/ui/*` — minimal stub shadcn components for typecheck/test only (NOT shipped).
- `apps/docs/registry/components/shadcn/__tests__/adapters.test.tsx` — render/bridge tests.
- `apps/docs/tsconfig.json` / `apps/docs/vitest.config.ts` — add `@/components/ui/*` path alias → fixtures (test scope).
- `apps/docs/registry/build/items.ts` — ship adapter files, set `components.source: '@/components/zod-form'`, react usage uses the map, update `registryDependencies`.
- `apps/docs/registry/sample/schema.ts` — add a `joinedAt: z.date().optional()` field.
- `apps/docs/static/r/*.json` — regenerated.

---

## Task 1: Stub fixtures + alias so adapters can compile/test

**Files:**
- Create: `apps/docs/registry/components/shadcn/__fixtures__/ui/{input,textarea,checkbox,switch,select,radio-group,label,button,popover,calendar}.tsx`
- Modify: `apps/docs/tsconfig.json`, `apps/docs/vitest.config.ts`

- [ ] **Step 1: Write minimal stub components matching shadcn APIs** (only what adapters use). Example for the controlled ones:

```tsx
// __fixtures__/ui/checkbox.tsx
import * as React from 'react';
export function Checkbox(props: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <input
      type="checkbox"
      id={props.id}
      disabled={props.disabled}
      checked={!!props.checked}
      onChange={(e) => props.onCheckedChange?.(e.target.checked)}
    />
  );
}
```

```tsx
// __fixtures__/ui/select.tsx — Radix-shaped stub
import * as React from 'react';
export function Select(props: { value?: string; onValueChange?: (v: string) => void; disabled?: boolean; children?: React.ReactNode }) {
  return <div data-select data-value={props.value}>{props.children}</div>;
}
export function SelectTrigger(props: { id?: string; children?: React.ReactNode }) { return <button type="button" id={props.id}>{props.children}</button>; }
export function SelectValue(props: { placeholder?: string }) { return <span>{props.placeholder}</span>; }
export function SelectContent(props: { children?: React.ReactNode }) { return <div>{props.children}</div>; }
export function SelectItem(props: { value: string; disabled?: boolean; children?: React.ReactNode }) {
  return <option value={props.value} disabled={props.disabled}>{props.children}</option>;
}
```

(Write equivalent minimal stubs for `input`, `textarea`, `switch` [checked/onCheckedChange], `radio-group` [RadioGroup value/onValueChange + RadioGroupItem value], `label`, `button`, `popover` [Popover/PopoverTrigger/PopoverContent], `calendar` [Calendar: `mode`, `selected?: Date`, `onSelect?: (d?: Date) => void`]. Each stub only needs the props the adapters pass.)

- [ ] **Step 2: Add the `@/components/ui/*` alias** (test/typecheck scope) in `apps/docs/vitest.config.ts` (`resolve.alias`) and `apps/docs/tsconfig.json` (`compilerOptions.paths`) → `apps/docs/registry/components/shadcn/__fixtures__/ui/*`. Keep `registry/**/*.ts*` in the docs `include`.

- [ ] **Step 3: Verify** `pnpm --filter @zod-to-form/docs run type-check` resolves the alias (no errors yet — no adapters). Commit.

```bash
git add apps/docs/registry/components/shadcn/__fixtures__ apps/docs/tsconfig.json apps/docs/vitest.config.ts
git commit -m "test(registry): stub shadcn ui fixtures + alias for adapter tests"
```

---

## Task 2: Input + Textarea adapters (pass-through)

**Files:** Create `…/shadcn/input.tsx`, `…/shadcn/textarea.tsx`; Test `…/__tests__/adapters.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { Input } from '../input.js';
it('Input forwards register props to shadcn Input', () => {
  render(<Input id="name" name="name" onChange={() => {}} />);
  expect(screen.getByRole('textbox')).toBeInTheDocument();
});
```

- [ ] **Step 2:** Run `pnpm --filter @zod-to-form/docs exec vitest run registry/components/shadcn/__tests__/adapters.test.tsx` → FAIL (no `input.js`).

- [ ] **Step 3: Implement** (pass-through; uncontrolled fields hand RHF register props straight through):

```tsx
// input.tsx
import * as React from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';
export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof ShadcnInput>>(
  (props, ref) => <ShadcnInput ref={ref} {...props} />
);
Input.displayName = 'Input';
```

```tsx
// textarea.tsx
import * as React from 'react';
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea';
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<typeof ShadcnTextarea>>(
  (props, ref) => <ShadcnTextarea ref={ref} {...props} />
);
Textarea.displayName = 'Textarea';
```

- [ ] **Step 4:** Run the test → PASS. **Step 5:** Commit `feat(registry): add shadcn Input/Textarea adapters`.

---

## Task 3: Checkbox + Switch adapters (controlled boolean)

**Files:** Create `…/shadcn/checkbox.tsx`, `…/shadcn/switch.tsx`; extend the test file.

- [ ] **Step 1: Failing test** — toggling calls `onChange` with a boolean:

```tsx
import { fireEvent, render } from '@testing-library/react';
import { Checkbox } from '../checkbox.js';
it('Checkbox bridges value→checked and onCheckedChange→onChange(boolean)', () => {
  const onChange = vi.fn();
  const { container } = render(<Checkbox value={false} onChange={onChange} id="ok" />);
  fireEvent.click(container.querySelector('input')!);
  expect(onChange).toHaveBeenCalledWith(true);
});
```

- [ ] **Step 2:** Run → FAIL. **Step 3: Implement**:

```tsx
// checkbox.tsx
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox';
type Props = { value?: boolean; onChange?: (v: boolean) => void; onBlur?: () => void; disabled?: boolean; id?: string; name?: string };
export function Checkbox({ value, onChange, disabled, id }: Props) {
  return <ShadcnCheckbox id={id} disabled={disabled} checked={!!value} onCheckedChange={(c) => onChange?.(c === true)} />;
}
```

```tsx
// switch.tsx — identical bridge against @/components/ui/switch
import { Switch as ShadcnSwitch } from '@/components/ui/switch';
type Props = { value?: boolean; onChange?: (v: boolean) => void; disabled?: boolean; id?: string };
export function Switch({ value, onChange, disabled, id }: Props) {
  return <ShadcnSwitch id={id} disabled={disabled} checked={!!value} onCheckedChange={(c) => onChange?.(c === true)} />;
}
```

- [ ] **Step 4:** Tests PASS (add a Switch test mirroring Checkbox). **Step 5:** Commit `feat(registry): add shadcn Checkbox/Switch adapters`.

---

## Task 4: Select adapter (options, controlled)

**Files:** Create `…/shadcn/select.tsx`; extend test.

- [ ] **Step 1: Failing test** — renders options, selecting calls `onChange(value)`:

```tsx
import { Select } from '../select.js';
it('Select renders options and bridges onValueChange→onChange', () => {
  const onChange = vi.fn();
  render(<Select value="" onChange={onChange} options={[{ value: 'a', label: 'A' }]} id="s" />);
  // stub renders <option value="a">A</option>
  // (assert option present; interaction asserted via the stub's onValueChange path)
});
```

- [ ] **Step 2:** FAIL. **Step 3: Implement**:

```tsx
// select.tsx
import { Select as ShadcnSelect, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { FormFieldOption } from '@zod-to-form/core';
type Props = { value?: string | number; onChange?: (v: string) => void; options?: FormFieldOption[]; disabled?: boolean; id?: string; placeholder?: string };
export function Select({ value, onChange, options = [], disabled, id, placeholder }: Props) {
  return (
    <ShadcnSelect value={value == null ? undefined : String(value)} onValueChange={(v) => onChange?.(v)} disabled={disabled}>
      <SelectTrigger id={id}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={String(o.value)} value={String(o.value)} disabled={o.disabled}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  );
}
```

- [ ] **Step 4:** PASS. **Step 5:** Commit `feat(registry): add shadcn Select adapter`.

---

## Task 5: RadioGroup adapter (options, controlled)

**Files:** Create `…/shadcn/radio-group.tsx`; extend test.

- [ ] **Step 1: Failing test** (selecting an item → `onChange(value)`). **Step 2:** FAIL. **Step 3: Implement**:

```tsx
// radio-group.tsx
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { FormFieldOption } from '@zod-to-form/core';
type Props = { value?: string | number; onChange?: (v: string) => void; options?: FormFieldOption[]; disabled?: boolean; name?: string };
export function RadioGroup({ value, onChange, options = [], disabled, name }: Props) {
  return (
    <ShadcnRadioGroup value={value == null ? undefined : String(value)} onValueChange={(v) => onChange?.(v)} disabled={disabled}>
      {options.map((o) => {
        const itemId = `${name ?? 'radio'}-${String(o.value)}`;
        return (
          <div key={String(o.value)}>
            <RadioGroupItem value={String(o.value)} id={itemId} disabled={o.disabled} />
            <Label htmlFor={itemId}>{o.label}</Label>
          </div>
        );
      })}
    </ShadcnRadioGroup>
  );
}
```

- [ ] **Step 4:** PASS. **Step 5:** Commit `feat(registry): add shadcn RadioGroup adapter`.

---

## Task 6: DatePicker adapter (composed Popover + Calendar)

**Files:** Create `…/shadcn/date-picker.tsx`; extend test.

- [ ] **Step 1: Failing test** — selecting a day calls `onChange(Date)`; current `value: Date` shows formatted label.

```tsx
import { DatePicker } from '../date-picker.js';
it('DatePicker bridges Calendar onSelect→onChange(Date)', () => {
  const onChange = vi.fn();
  render(<DatePicker value={undefined} onChange={onChange} id="d" />);
  // stub Calendar exposes a button that calls onSelect(new Date('2026-01-02'))
  // assert onChange called with a Date
});
```

- [ ] **Step 2:** FAIL. **Step 3: Implement** (composed; uses `date-fns` `format` — shadcn's calendar pulls it transitively, but import it directly here):

```tsx
// date-picker.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
type Props = { value?: Date | string; onChange?: (v: Date | undefined) => void; disabled?: boolean; id?: string };
export function DatePicker({ value, onChange, disabled, id }: Props) {
  const date = value == null || value === '' ? undefined : value instanceof Date ? value : new Date(value);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" disabled={disabled}>
          {date ? format(date, 'PPP') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar mode="single" selected={date} onSelect={(d?: Date) => onChange?.(d)} />
      </PopoverContent>
    </Popover>
  );
}
```

(Extend the `button`/`calendar`/`popover` stub fixtures so `Calendar` renders a button that calls `onSelect(new Date('2026-01-02'))`, enabling the test.)

- [ ] **Step 4:** PASS. **Step 5:** Commit `feat(registry): add shadcn DatePicker adapter (Popover+Calendar)`.

---

## Task 7: index.tsx — named exports + `components` map

**Files:** Create `…/shadcn/index.tsx`; extend test.

- [ ] **Step 1: Failing test**:

```tsx
import { components } from '../index.js';
it('components map exposes all core field components', () => {
  for (const k of ['Input','Textarea','Checkbox','Switch','Select','RadioGroup','DatePicker']) {
    expect(components[k as keyof typeof components]).toBeTypeOf('function');
  }
});
```

- [ ] **Step 2:** FAIL. **Step 3: Implement**:

```tsx
// index.tsx
export { Input } from './input.js';
export { Textarea } from './textarea.js';
export { Checkbox } from './checkbox.js';
export { Switch } from './switch.js';
export { Select } from './select.js';
export { RadioGroup } from './radio-group.js';
export { DatePicker } from './date-picker.js';
import { Input } from './input.js';
import { Textarea } from './textarea.js';
import { Checkbox } from './checkbox.js';
import { Switch } from './switch.js';
import { Select } from './select.js';
import { RadioGroup } from './radio-group.js';
import { DatePicker } from './date-picker.js';
export const components = { Input, Textarea, Checkbox, Switch, Select, RadioGroup, DatePicker };
```

- [ ] **Step 4:** PASS. **Step 5:** Commit `feat(registry): aggregate shadcn adapters into components map`.

---

## Task 8: Sample schema — add a date field

**Files:** Modify `apps/docs/registry/sample/schema.ts`; update `apps/docs/registry/build/__tests__/items.test.ts`.

- [ ] **Step 1:** Update the existing walkSchema test to expect 5 fields incl. `joinedAt`. Run → FAIL.
- [ ] **Step 2: Add the field**:

```ts
joinedAt: z.date().optional().meta({ title: 'Joined' }),
```

- [ ] **Step 3:** Run → PASS. **Step 4:** Commit `feat(registry): add date field to sample schema (exercises DatePicker)`.

---

## Task 9: Wire adapters into the three starters

**Files:** Modify `apps/docs/registry/build/items.ts`, `apps/docs/registry/build/docs.ts`; update `apps/docs/registry/build/__tests__/items.test.ts`.

- [ ] **Step 1: Failing tests**: each item ships the adapter files under `@components/zod-form/`; config `source` is `@/components/zod-form`; react item's usage imports `components` from `@/components/zod-form` and passes `components={components}`; `registryDependencies` includes the new set.

- [ ] **Step 2: Implement**:
  - Read each adapter file's source at build time (like `SAMPLE_SCHEMA_SRC`) — add a helper that reads all of `apps/docs/registry/components/shadcn/*.tsx` + `index.tsx` and emits them as `files[]` entries with `target: '@components/zod-form/<name>.tsx'`, type `registry:component`. Apply to all three items.
  - Change `sampleConfigSource(...)` callers to pass `'@/components/zod-form'`.
  - `REGISTRY_DEPENDENCIES` (and `CODEGEN_REGISTRY_DEPENDENCIES`) → `['input','textarea','checkbox','switch','select','radio-group','label','button','popover','calendar','form']`.
  - React `ZOD_FORM_USAGE`: `import { components } from '@/components/zod-form';` and `<ZodForm schema={schema} components={components} onSubmit={…} />`. Remove the old `ZOD_FORM_COMPONENTS_SRC` stub module.
  - Keep `@zod-to-form/core` devDep (config) and `@zod-to-form/react` dep (react item only).

- [ ] **Step 3:** Run items tests → PASS. **Step 4:** Commit `feat(registry): point starters at shared shadcn adapter module`.

---

## Task 10: Regenerate + full verification

**Files:** `apps/docs/static/r/*.json` (regenerated).

- [ ] **Step 1:** `pnpm --filter @zod-to-form/core build && pnpm --filter @zod-to-form/codegen build` (so the registry build uses current codegen), then `pnpm registry:build`.
- [ ] **Step 2: Verify** the generated `starter-codegen.json` `generated-form.tsx` imports `Checkbox`/`DatePicker` from `@/components/zod-form` (not raw inputs / `@/components/ui/form`); `starter-react.json` ships the adapter files + `components={components}`; all items ship the 8 adapter files with `@components/zod-form/` targets.
- [ ] **Step 3:** `pnpm --filter @zod-to-form/docs exec vitest run` (adapters + items + conformance all green), `pnpm --filter @zod-to-form/docs run type-check`, `pnpm registry:check` (exit 0).
- [ ] **Step 4:** Commit `chore(registry): regenerate starters with shadcn adapter set`.

---

## Self-Review

- **Spec coverage:** core-set adapters (T2–T6), shared module + map (T7), sample date field (T8), config `source` + react map + registryDeps wiring (T9), regenerate + conformance (T10), testability of consumer-targeted source (T1 fixtures+alias). Covered.
- **Placeholders:** none — each adapter has complete bridging code; fixtures are concrete; the one "write equivalent stubs" instruction lists exactly which props each needs.
- **Type consistency:** controlled adapters all use `{ value, onChange, options?, disabled, id, name }`; `components` map keys match z2f field component names (Input/Textarea/Checkbox/Switch/Select/RadioGroup/DatePicker) used in T7 and referenced by config in T9.

## Risks / notes for the implementer

- The stub fixtures (T1) exist only so the source typechecks/renders in THIS repo; the shipped `files[].content` is the verbatim adapter source importing `@/components/ui/*`, which resolves in the consumer's project. Never ship the fixtures.
- Confirm shadcn's real component prop names match the stubs (Checkbox `onCheckedChange`, Select `onValueChange`, Calendar `mode/selected/onSelect`) against current shadcn docs before finalizing — the adapters must match what `npx shadcn add` installs.
- `date-fns` is a dependency of the DatePicker adapter source; ensure it's noted (shadcn's `calendar` pulls `react-day-picker`+`date-fns`, so adding `calendar` to registryDeps covers it, but verify the consumer gets `date-fns`).
- The merged `setValueAs` coercion (master) handles the date field's `Date` value; verify the round-trip in the smoke test.

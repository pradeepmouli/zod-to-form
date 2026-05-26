# shadcn Base UI Component Shapes

**Purpose:** Ground-truth for the owned-output migration — records real exported names and
controlled-prop API for each component so downstream tasks do not guess.

**Source:** Actual source files fetched from `shadcn-ui/ui` repo,
path `apps/v4/registry/bases/base/ui/<component>.tsx`, via `gh api`.
Base UI primitive prop types confirmed from `base-ui.com/react/components/<name>#api-reference`.
Date: 2026-05-26.

---

## How shapes were obtained

All source files were fetched directly from the shadcn-ui/ui GitHub repo using the `gh api` CLI
(authenticated). The path prefix for the Base UI registry is
`apps/v4/registry/bases/base/ui/` (not `apps/www/registry/...` — that path no longer exists).
Base UI primitive prop contracts were cross-checked at `https://base-ui.com/react/components/`.

---

## 1. Checkbox

**File:** `apps/v4/registry/bases/base/ui/checkbox.tsx`

**Exports:** `Checkbox` (single named export — a function component, NOT a namespace object)

**Underlying primitive:** `@base-ui/react/checkbox` → `Checkbox.Root` / `Checkbox.Indicator`

**Controlled props (from `CheckboxPrimitive.Root.Props`):**

| Prop | Type | Notes |
|---|---|---|
| `checked` | `boolean \| undefined` | Controlled state |
| `defaultChecked` | `boolean \| undefined` | Uncontrolled initial value |
| `onCheckedChange` | `(checked: boolean, eventDetails: ChangeEventDetails) => void` | **Plain `boolean` — NOT `boolean \| 'indeterminate'`** |
| `indeterminate` | `boolean \| undefined` | Separate prop (not part of `checked`) |
| `name` | `string \| undefined` | Form field name |
| `id` | `string \| undefined` | Element id |
| `disabled` | `boolean \| undefined` | Supported on root |
| `value` | `string \| undefined` | Submitted form value |
| `required` | `boolean \| undefined` | Form constraint |
| `readOnly` | `boolean \| undefined` | Prevents state change |
| `inputRef` | `React.Ref<HTMLInputElement>` | Ref to the **hidden input** (not the root span) |
| `render` | `ReactElement \| function` | Element replacement (Base UI's `asChild` equivalent) |

**Ref target:** The root component's `ref` reaches the outer `<span>` (role=checkbox button).
To get the `<input>` element (for RHF `register`), pass `inputRef`. The `ref` spread via
`{...props}` in the shadcn wrapper does NOT forward a ref at all — the wrapper is an
un-memoized function component without `forwardRef`.

**`onBlur`:** Not a documented prop on `Checkbox.Root`. The root renders a `<span>`; blur
events on the hidden `<input>` are accessible via `inputRef`.

**SPEC ASSUMPTION CHECK:**
- `onCheckedChange(boolean)` — CONFIRMED plain boolean, value-first.
- `'indeterminate'` is NOT a `checked` value — it is a separate `indeterminate` prop.
  If the spec assumed `checked: boolean | 'indeterminate'` (Radix pattern), **that is FALSE**.

---

## 2. Switch

**File:** `apps/v4/registry/bases/base/ui/switch.tsx`

**Exports:** `Switch` (single named export)

**Additional prop:** `size?: "sm" | "default"` (shadcn-added, not in primitive)

**Underlying primitive:** `@base-ui/react/switch` → `Switch.Root` / `Switch.Thumb`

**Controlled props (from `SwitchPrimitive.Root.Props`):**

| Prop | Type | Notes |
|---|---|---|
| `checked` | `boolean \| undefined` | Controlled state |
| `defaultChecked` | `boolean` | Default: `false` |
| `onCheckedChange` | `(checked: boolean, eventDetails: Switch.Root.ChangeEventDetails) => void` | **Plain `boolean`** |
| `name` | `string \| undefined` | Form field name |
| `id` | `string \| undefined` | Element id |
| `disabled` | `boolean` | Default: `false` |
| `value` | `string \| undefined` | Submitted value when on |
| `uncheckedValue` | `string \| undefined` | Submitted value when off |
| `required` | `boolean` | Default: `false` |
| `readOnly` | `boolean` | Default: `false` |
| `inputRef` | `React.Ref<HTMLInputElement>` | Ref to **hidden input** |
| `render` | `ReactElement \| function` | Element replacement |

**Ref target:** Same pattern as Checkbox. The shadcn wrapper is also a plain function component
(no `forwardRef`). Use `inputRef` for the hidden `<input>` element.

**`onBlur`:** Not a documented prop on `Switch.Root`.

**Data attributes for styling:** `data-checked`, `data-unchecked`, `data-disabled`,
`data-readonly`, `data-required`, `data-valid`, `data-invalid`, `data-dirty`, `data-touched`,
`data-filled`, `data-focused` — useful for RHF validation state display.

**SPEC ASSUMPTION CHECK:**
- `onCheckedChange(boolean)` plain boolean — CONFIRMED.
- Separate `inputRef` for hidden input — matches checkbox.

---

## 3. Select

**File:** `apps/v4/registry/bases/base/ui/select.tsx`

**Exports (all named):**

```
Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
SelectScrollDownButton, SelectScrollUpButton, SelectSeparator,
SelectTrigger, SelectValue
```

Note: `SelectScrollUpButton` and `SelectScrollDownButton` are additional exports not present in
the Radix variant. There is NO `SelectPortal` export (portal is used internally inside
`SelectContent`).

**Underlying primitive:** `@base-ui/react/select` → `SelectPrimitive.*` namespace

**`Select` is a direct alias:** `const Select = SelectPrimitive.Root` — no wrapper, full
`SelectPrimitive.Root.Props` pass-through.

**Controlled props on `SelectPrimitive.Root` (i.e., `Select`):**

| Prop | Type | Notes |
|---|---|---|
| `value` | `Value \| Value[] \| null` | Controlled value |
| `defaultValue` | same | Uncontrolled initial |
| `onValueChange` | `(value: Value[] \| Value \| null, eventDetails: Select.Root.ChangeEventDetails) => void` | Change callback |
| `open` | `boolean` | Controlled open state |
| `defaultOpen` | `boolean` | |
| `onOpenChange` | `(open: boolean, eventDetails: ...) => void` | |
| `items` | `Record<string, ReactNode> \| { label: ReactNode; value: any }[] \| Group[]` | **See below** |

**`items` prop — CRITICAL:** Base UI Select.Root accepts an `items` prop. When present,
`<Select.Value>` automatically renders the label of the selected item rather than the raw value
(enables label display without custom rendering logic). **However**, this does NOT auto-render
`<SelectItem>` children — you still must compose `<SelectContent>` with mapped `<SelectItem>`
children manually. The `items` prop is used exclusively by `<SelectValue>` for label lookup.

**Render pattern:** Base UI uses `render` prop (e.g., `render={<Button .../>}`) everywhere
instead of Radix's `asChild`. The shadcn wrapper's `SelectTrigger` and icon components use
`render` internally.

**Composition:** Manual composition required. No auto-render of option list from `items`.
Pattern:
```tsx
<Select value={v} onValueChange={setV} items={itemsArray}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    {itemsArray.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
  </SelectContent>
</Select>
```

**SPEC ASSUMPTION CHECK:**
- Export names: mostly match Radix equivalents EXCEPT `SelectPortal` is absent (portal is
  internal), and two scroll-button exports are added (`SelectScrollUpButton`,
  `SelectScrollDownButton`). **If spec expects `SelectPortal` as an export, that is FALSE.**
- `items` prop EXISTS on `Select.Root` but ONLY for label lookup in `<SelectValue>` —
  it does NOT auto-render the option list. Manual `<SelectItem>` children are still required.
  **If spec assumed `items` auto-renders the list, that is FALSE.**
- `onValueChange` signature: value-first, confirmed. But the value type is
  `Value[] | Value | null` (not just `string`), and a second `eventDetails` arg is present.

---

## 4. RadioGroup

**File:** `apps/v4/registry/bases/base/ui/radio-group.tsx`

**Exports:** `RadioGroup`, `RadioGroupItem`

**Underlying primitives:**
- `RadioGroup` wraps `@base-ui/react/radio-group` → `RadioGroupPrimitive`
- `RadioGroupItem` wraps `@base-ui/react/radio` → `RadioPrimitive.Root`

**Controlled props on `RadioGroup` (from `RadioGroupPrimitive.Props`):**

| Prop | Type | Notes |
|---|---|---|
| `value` | `Value \| undefined` | Controlled selected value |
| `defaultValue` | `Value \| undefined` | Uncontrolled initial value |
| `onValueChange` | `(value: Value, eventDetails: RadioGroup.ChangeEventDetails) => void` | Change callback — value-first |

**`RadioGroupItem` props (from `RadioPrimitive.Root.Props`):**

| Prop | Type | Notes |
|---|---|---|
| `value` | `string` | Option value |
| `id` | `string` | For `htmlFor` pairing with `<Label>` |
| `disabled` | `boolean` | Disables this item |

**No `items` prop** — options must be composed manually.

**Composition pattern:**
```tsx
<RadioGroup value={v} onValueChange={setV}>
  <div className="flex items-center gap-3">
    <RadioGroupItem value="opt1" id="opt1" />
    <Label htmlFor="opt1">Option 1</Label>
  </div>
</RadioGroup>
```

`Label` is imported separately from `@/components/ui/label`.

**Note:** Base UI separates `RadioGroup` (from `@base-ui/react/radio-group`) from `Radio`
(from `@base-ui/react/radio`). The shadcn wrapper re-exports only `RadioGroup` and
`RadioGroupItem` (not `RadioGroupIndicator` directly — that is internal to `RadioGroupItem`).

**SPEC ASSUMPTION CHECK:**
- Exports `RadioGroup` and `RadioGroupItem` — matches Radix naming. CONFIRMED.
- `onValueChange(value)` value-first — CONFIRMED.
- No `items` prop — CONFIRMED, manual composition required.

---

## 5. Date Picker

**File:** `apps/v4/examples/base/date-picker-demo.tsx` (composite example, not a standalone
component file — date-picker is an example pattern, not a registered UI component)

**State management:** **Self-stateful** — all examples use `React.useState<Date>()`.
No exported `DatePicker` component with controlled `value`/`onChange` props exists in the
registry. The pattern is a local composition.

**Calendar props used:**

| Prop | Value/Type | Notes |
|---|---|---|
| `mode` | `"single"` | Single-date selection (DayPicker mode) |
| `selected` | `Date \| undefined` | Currently selected date |
| `onSelect` | `(date: Date \| undefined) => void` | Update callback |
| `defaultMonth` | `Date \| undefined` | Initial displayed month |

**Trigger pattern:** `PopoverTrigger` uses the Base UI `render` prop:
```tsx
<PopoverTrigger render={<Button variant="outline" ... />}>
  {date ? format(date, "PPP") : <span>Pick a date</span>}
</PopoverTrigger>
```
NOT `asChild` — that is a Radix pattern. **`asChild` does not exist in Base UI.**

**SPEC ASSUMPTION CHECK:**
- Date-picker is self-stateful — CONFIRMED. There is no controlled date-picker component.
  Any controlled usage requires the consumer to manage `date` state and pass
  `selected={date}` / `onSelect={setDate}` to `<Calendar>`.
- Trigger uses `render` prop, NOT `asChild` — **if spec assumed `asChild`, that is FALSE**.
- `mode="single"` / `selected` / `onSelect` — CONFIRMED as the Calendar props used.

---

## 6. Calendar

**File:** `apps/v4/registry/bases/base/ui/calendar.tsx`

**Exports:** `Calendar`, `CalendarDayButton`

**Underlying library:** **React DayPicker** (`react-day-picker`) — NOT a Base UI primitive.
Calendar is not in the Base UI component library; shadcn wraps DayPicker for both Radix and
Base UI bases.

**Props (full `React.ComponentProps<typeof DayPicker>` pass-through plus one extra):**

| Prop | Type | Notes |
|---|---|---|
| `mode` | `"single" \| "range" \| "multiple" \| "none"` | DayPicker mode |
| `selected` | `Date \| DateRange \| Date[] \| undefined` | Selected date(s) — type depends on `mode` |
| `onSelect` | Varies by mode | `(date: Date \| undefined) => void` for `mode="single"` |
| `defaultMonth` | `Date \| undefined` | Initial displayed month |
| `captionLayout` | `"label" \| "dropdown"` | Default: `"label"` |
| `showOutsideDays` | `boolean` | Default: `true` |
| `buttonVariant` | shadcn Button variant | Extra prop for nav button styling |
| `classNames` | `ClassNames` | DayPicker class overrides |
| `components` | `CustomComponents` | DayPicker component overrides |
| `locale` | `Partial<Locale>` | date-fns locale |

**`selected` type for `mode="single"`:** `Date | undefined`
**`onSelect` type for `mode="single"`:** `(date: Date | undefined) => void`

**SPEC ASSUMPTION CHECK:**
- Calendar is DayPicker-based in BOTH Radix and Base UI variants — same underlying library.
- `selected` / `onSelect` / `mode` — CONFIRMED as controlled props.
- `CalendarDayButton` is also exported (not just `Calendar`) — may be relevant if customizing
  day cells.

---

## 7. Input

**File:** `apps/v4/registry/bases/base/ui/input.tsx`

**Exports:** `Input`

**Underlying primitive:** `@base-ui/react/input` → `InputPrimitive`

**Props:** `React.ComponentProps<"input">` — full HTML input props pass-through. The component
spreads `{ type, ...props }` directly to `InputPrimitive`, which in turn renders a native
`<input>` element.

**Ref:** `InputPrimitive` from Base UI forwards a ref to the underlying `<input>` element.
The shadcn wrapper is a plain function (no `forwardRef`), but `InputPrimitive` handles ref
forwarding internally. **RHF `register` will work** — the `ref` in `{...props}` spread reaches
the native input via `InputPrimitive`'s ref forwarding.

**SPEC ASSUMPTION CHECK:** Native-input-backed, ref-forwarding confirmed. CORRECT.

---

## 8. Textarea

**File:** `apps/v4/registry/bases/base/ui/textarea.tsx`

**Exports:** `Textarea`

**Underlying element:** A **plain `<textarea>` element** — no Base UI primitive wrapper.
Props are `React.ComponentProps<"textarea">` spread directly to `<textarea>`.

**Ref:** Because it renders `<textarea>` directly, the `ref` in `{...props}` reaches the native
`<textarea>` element. **RHF `register` will work.**

**SPEC ASSUMPTION CHECK:** Native-textarea-backed, ref-forwarding confirmed. CORRECT.
Note: Unlike `Input`, `Textarea` does NOT go through a Base UI primitive — it's a raw
`<textarea>` with className styling.

---

## Summary: Spec Assumptions vs Reality

| Assumption | Status | Detail |
|---|---|---|
| `Checkbox.onCheckedChange` is plain `boolean` | CONFIRMED | No `'indeterminate'` in `checked` or `onCheckedChange`; indeterminate is a separate `indeterminate` prop |
| `Switch.onCheckedChange` is plain `boolean` | CONFIRMED | Value-first, same as checkbox |
| Select requires composed `<SelectItem>` children | CONFIRMED | `items` prop only feeds label lookup in `<SelectValue>`, does NOT auto-render list |
| RadioGroup requires composed children, no `items` prop | CONFIRMED | Manual composition always required |
| Date-picker is self-stateful | CONFIRMED | No exported controlled `DatePicker` component |
| Calendar uses `mode` / `selected` / `onSelect` | CONFIRMED | DayPicker API |
| Input/Textarea are native-backed and ref-forward | CONFIRMED | RHF `register()` will work |
| Checkbox/Switch wrapper uses `forwardRef` | **FALSE** | Shadcn wrappers are plain function components; use `inputRef` prop to reach the hidden `<input>` |
| Trigger uses `asChild` | **FALSE** | Base UI uses `render` prop everywhere, not `asChild` |
| `SelectPortal` is an export | **FALSE** | Portal is used internally inside `SelectContent`; not exported |
| Export names match Radix exactly | **MOSTLY TRUE** with two additions | Select adds `SelectScrollUpButton` + `SelectScrollDownButton` vs Radix; both Radix and Base UI export `RadioGroup`/`RadioGroupItem` with same names |
| `checked: boolean \| 'indeterminate'` (Radix pattern) | **FALSE for Base UI** | Base UI separates `checked: boolean` and `indeterminate: boolean` into two distinct props |

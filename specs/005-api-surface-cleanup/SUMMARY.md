# 005 — API Surface Cleanup

## Overview

A breaking-change refactor that simplifies the zod-to-form configuration API by merging redundant concepts, removing special cases, and adding long-requested field properties. The result is fewer configuration keys for users to learn, zero runtime dependencies in generated code, and a customizable field template system.

**Branch**: `005-api-surface-cleanup`
**Packages affected**: `@zod-to-form/core`, `@zod-to-form/react`, `@zod-to-form/codegen`, `@zod-to-form/cli`, playground app
**Tests**: 464 passing across all packages

---

## Breaking Changes

### `propMap` merged into `props`

The separate `propMap` property on `FieldConfigBase` and `ComponentOverride` has been removed. Field expression values (`field.value`, `field.onChange`, `field.onBlur`, `field.ref`, `field.name`) are now placed directly in `props` and auto-detected at render time.

```typescript
// Before
{ props: { placeholder: 'Pick one' }, propMap: { onValueChange: 'field.onChange' } }

// After
{ props: { placeholder: 'Pick one', onValueChange: 'field.onChange' } }
```

Props merge order: preset override props → per-field config props (field wins on conflict, shallow merge).

### `gridColumn` removed

The dedicated `gridColumn` property on `FieldConfigBase` and `FormField` has been removed. Layout hints are now passed through `props` like any other value.

```typescript
// Before
{ gridColumn: 'span 2' }

// After — Tailwind
{ props: { className: 'col-span-2' } }

// After — inline CSS
{ props: { style: { gridColumn: 'span 2' } } }
```

The renderer forwards `style` and `className` from field props to the wrapper element.

### `sectionComponents` removed

The separate `sectionComponents` map on `RuntimeComponentConfig` has been removed. Section components now resolve from `componentModule` like all other components — one dispatch mechanism for everything.

```typescript
// Before
<ZodForm componentConfig={{
  componentModule: myComponents,
  sectionComponents: { billing: BillingSection }
}} />

// After
<ZodForm componentConfig={{
  componentModule: { ...myComponents, BillingSection }
}} />
```

### `FormPrimitivesConfig` removed

The `formPrimitives` config and `FormPrimitivesConfig` type have been removed entirely. Field composition is now controlled by the field template system (see below), which subsumes this functionality.

### Migration warnings

Console warnings are emitted at runtime when removed config keys are detected:
- `propMap` on field config or component overrides
- `gridColumn` on field config
- `sectionComponents` on component config
- Field expression values in `props` without `controlled: true`

---

## New Features

### Field template system

Field composition (label + input + description + helpText + error) is now controlled by a customizable template component rather than being hardcoded.

**Runtime**: The renderer resolves a `FieldTemplate` component from `componentModule['FieldTemplate']`, falling back to `DefaultFieldTemplate`. The template receives `FieldTemplateProps`:

```typescript
interface FieldTemplateProps {
  children: ReactNode;    // rendered input element
  label: string;
  description?: string;
  helpText?: string;
  error?: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  deprecated?: boolean;
}
```

**Codegen**: Each preset (shadcn, html) has a concrete template. The shadcn preset renders `<FormItem>/<FormLabel>/<FormControl>/<FormDescription>/<FormMessage>`. The html preset renders `<div>/<label>/<p>`. The codegen auto-imports the form primitive components the template needs.

**Config**: `ComponentsConfig` accepts an optional `fieldTemplate` path for custom templates that override the preset default.

### Object field component dispatch

Object-type fields (nested `z.object()`) can now render as custom layout components (tabs, accordion, stepper) instead of the default `<fieldset><legend>`.

```typescript
fields: {
  billing:  { component: 'TabPanel', props: { icon: 'credit-card' }, order: 1 },
  shipping: { component: 'TabPanel', props: { icon: 'truck' }, order: 2 },
}
```

The component resolves from `componentModule`. Falls back to `<fieldset>` with a console warning if not found.

### `disabled` field property

`FieldConfigBase` and `FormField` now support `disabled: boolean` (defaults to `false`). Renders the input as non-interactive (greyed out). Applied in both runtime and codegen.

### `helpText` field property

`FieldConfigBase` and `FormField` now support `helpText?: string`. Renders below the input, distinct from `description` which renders below the label. Supported in the field template.

### `deprecated` field indicator

`FormField` now surfaces `deprecated: boolean` (defaults to `false`) from `z.globalRegistry`. The field template renders a strikethrough label with an accessible warning icon. Both runtime and codegen handle this.

### Zero-dependency generated code

CLI-generated form files no longer import from `@zod-to-form/core` or `@zod-to-form/react`:

- `StripIndexSignature` type utility — inlined in generated file
- `normalizeFormValues` — inlined for html preset, omitted for shadcn (controlled components handle types natively)
- Resolver — shadcn uses `zodResolver(schema)` directly, html wraps with `normalizeFormValues`

Generated code depends only on: `react`, `react-hook-form`, `@hookform/resolvers/zod`, `zod`, and the user's component source.

### `FieldExpression` type

A new exported string union type `FieldExpression` provides IntelliSense for the five recognized field expression values:

```typescript
type FieldExpression =
  | 'field.value'
  | 'field.onChange'
  | 'field.onBlur'
  | 'field.ref'
  | 'field.name';
```

---

## Processor Improvements

### Typed processor signatures

All processors now receive specific Zod v4 types instead of the generic `$ZodType`:

| Processor | Schema Type |
|-----------|------------|
| `processString` | `$ZodString` |
| `processTemplateLiteral` | `$ZodTemplateLiteral` |
| `processNumber` | `$ZodNumber \| $ZodBigInt` |
| `processBoolean` | `$ZodBoolean` |
| `processDate` | `$ZodDate \| $ZodISODate` |
| `processEnum` | `$ZodEnum` |
| `processLiteral` | `$ZodLiteral` |
| `processObject` | `$ZodObject` |
| `processArray` | `$ZodArray` |
| `processTuple` | `$ZodTuple` |
| `processUnion` | `$ZodUnion` |
| `processDiscriminatedUnion` | `$ZodDiscriminatedUnion` |
| `processIntersection` | `$ZodIntersection` |
| `processRecord` | `$ZodRecord` |
| `processMap` | `$ZodMap` |
| `processSet` | `$ZodSet` |
| `processDefault` | `$ZodDefault \| $ZodPrefault` |
| All wrappers | `$ZodOptional`, `$ZodNullable`, `$ZodReadonly`, `$ZodPipe`, `$ZodLazy` |

The registry uses a compile-time typed map to verify each processor matches its Zod type.

### Direct `schema._zod` access

The `getDef()`, `getBag()`, and `getShape()` wrapper functions have been removed. All processors now access `schema._zod.def` and `schema._zod.bag` directly with full type safety from the narrowed schema type.

### New collection processors

- **`processMap($ZodMap)`** — renders as `ArrayField` with key-value pair fieldsets
- **`processSet($ZodSet)`** — renders as `ArrayField` with the value type as item template
- **`processRecord($ZodRecord)`** — promoted from inline fallback to first-class processor with typed `def.valueType` access

### ISO date/time/datetime support

`processString` now detects Zod v4 string format subtypes (`z.string().date()`, `z.string().time()`, `z.string().datetime()`) via `def.format` and renders:

| Format | Component | Input Type |
|--------|-----------|------------|
| `date` | `DatePicker` | `date` |
| `time` | `DatePicker` | `time` |
| `datetime` | `DatePicker` | `datetime-local` |
| `email` | `Input` | `email` |
| `url` | `Input` | `url` |

### `processDiscriminatedUnion` separation

`processDiscriminatedUnion` is now a standalone processor with a proper `$ZodDiscriminatedUnion` signature. `processUnion` detects the discriminator property on the def and delegates automatically (since both share `def.type === "union"` in Zod v4).

---

## Type Design Improvements

- `FormField.disabled` and `FormField.deprecated` are now required booleans (default `false`), matching the pattern of `required`, `readOnly`, and `hidden`
- `TypedFieldConfigForComponent` and `UntypedFieldConfig` derive from `FieldConfigBase` via `Omit`, eliminating three-way field duplication
- `ComponentOverride.props` accepts `Record<string, unknown>` (replaces the removed `propMap: Record<string, string>`)
- `ComponentsConfig` gains `fieldTemplate?: string`
- React component validation (`isReactComponent`) accepts `React.memo`, `forwardRef`, and `lazy` components (not just functions)
- `fieldTemplate` validation uses `nonEmptyStringSchema` to reject empty strings

---

## Review Fixes Applied

Issues found during code review and addressed:

- `DefaultFieldTemplate` uses the merged component map (not `defaultComponentMap`) so consumer component overrides work
- `ControlledFieldInner` forwards `field.props` (schema-level props like `placeholder`)
- Section component resolution warns when components are missing from `componentModule`
- `FIELD_EXPRESSIONS` derived from `EXPRESSION_TO_FIELD_PROP` keys to prevent drift
- Removed unjustified `as` casts in codegen `resolvePropMap`
- Deprecated indicator has accessible labeling (`aria-hidden` on icon, `sr-only` text)
- `warnRemovedConfigKeys` runs once per form (not per field)
- Codegen warns when complex prop values are silently dropped

---

## Files Changed

27 source files, 10+ test files across 5 packages. Net reduction of ~300 lines from removing `formPrimitives`, `propMap`, `gridColumn`, `sectionComponents`, and the `getDef`/`getBag`/`getShape` wrapper functions.

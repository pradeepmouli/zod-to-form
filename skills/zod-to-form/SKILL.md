---
name: zod-to-form
description: Guide for configuring and using @zod-to-form to generate React Hook Form components from Zod schemas. Use when (1) setting up z2f config (defineConfig, field mappings, hidden fields, per-schema overrides), (2) generating forms with z2f CLI, (3) creating custom field adapters (TypeSelector, CardinalitySelector) that bridge controlled/uncontrolled components, (4) troubleshooting generated form output (missing fields, wrong components, unwanted fields appearing), or (5) understanding the z2f architecture (core walker, CLI codegen, runtime renderer).
---

# Zod To Form

Generate type-safe React Hook Form components from Zod schemas at build time.

## Architecture

```
@zod-to-form/core    Schema walker & FormField[] IR (zero deps, zod peer)
@zod-to-form/react   Runtime <ZodForm> renderer (peer deps only)
@zod-to-form/cli     Build-time codegen CLI -> .tsx files
```

The CLI reads Zod schemas, walks them with the core walker to produce `FormField[]`, then renders each field using configurable templates into standalone React components.

## Quick Start

```bash
# Initialize config
npx z2f init

# Generate forms
npx z2f generate --schema ./src/generated/zod-schemas.ts --out ./src/components/forms/generated
```

## Configuration (`z2f.config.ts`)

Use `defineConfig` from `@zod-to-form/core`. See [references/config-reference.md](references/config-reference.md) for full API.

```typescript
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/zod-form-components',
  formPrimitives: { field: 'Field', label: 'FieldLabel', control: 'FieldControl' },
  defaults: { mode: 'auto-save', ui: 'shadcn', overwrite: true, serverAction: false },
  include: ['DataSchema', 'UserSchema'],
  exclude: [],
  fieldTypes: { /* custom component registry */ },
  fields: { /* global field mappings */ },
  schemas: { /* per-schema overrides */ }
});
```

### Field Path Syntax

- Top-level: `'name'`, `'$type'`
- Nested object: `'typeCall.type'`, `'output.card'`
- Array items: `'attributes[].name'`, `'enumValues[].display'`
- Deep nesting: `'attributes[].typeCall.type'`

Always use `[]` bracket notation for arrays in config, never `${index}`.

### Hidden Fields

`hidden: true` completely excludes a field from generated output (no JSX, no `register()`, no import):

```typescript
fields: {
  $type: { hidden: true },                          // type discriminator
  'attributes[].$type': { hidden: true },            // nested discriminator
  'attributes[].typeCall.arguments': { hidden: true }, // internal array
  annotations: { hidden: true },                     // custom-rendered section
  conditions: { hidden: true },                      // custom-rendered section
}
```

### Per-Schema Overrides

Override global mappings for specific schemas. Use `order` for field sequence within array items:

```typescript
schemas: {
  DataSchema: {
    fields: {
      'attributes[].name': { fieldType: 'Input', order: 1 },
      'attributes[].typeCall.type': { fieldType: 'TypeSelector', order: 2 },
      'attributes[].card': { fieldType: 'CardinalitySelector', order: 3 },
      'attributes[].override': { hidden: true }
    }
  }
}
```

Per-schema overrides take precedence over global `fields`.

## Controlled Components

By default, generated forms use `register()` (uncontrolled). For components that need controlled behavior (Select, Combobox, custom widgets), mark them `controlled: true` in `fieldTypes`:

```typescript
fieldTypes: {
  Input: { component: 'Input' },                                    // uncontrolled (register)
  TypeSelector: { component: 'TypeSelector', controlled: true },    // controlled (Controller)
  CardinalitySelector: { component: 'CardinalitySelector', controlled: true },
}
```

The codegen automatically generates a `<Controller>` pattern for controlled components — no `forwardRef` or manual `useController` adapter needed.

### propMap

Remap RHF field props (`value`, `onChange`, `onBlur`) to component-specific prop names:

```typescript
fieldTypes: {
  MyCombobox: {
    component: 'MyCombobox',
    controlled: true,
    propMap: { onSelect: 'field.onChange', selectedValue: 'field.value' }
  }
}
```

`propMap` can also be set per-field in the `fields` or `schemas` config.

### Auto-detection

`z2f init` auto-detects controlled components by:
1. Known-controlled list (Select, Combobox, Slider, Switch, etc.)
2. Source heuristic (value + onChange props without forwardRef)

## Generated Form Pattern

Forms support both controlled (`values` prop) and uncontrolled (`defaultValues` prop) modes:

```tsx
<MyForm
  values={storeData}                    // controlled from store
  onValueChange={(data) => update(data)} // auto-save callback
/>
```

In auto-save mode, a `watch()` subscription fires `onValueChange` on every field change.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Internal fields showing | Add `hidden: true` with bracket notation path |
| Wrong component rendered | Check bracket notation: `items[].field` not `items.0.field` |
| Custom component not receiving value | Mark `controlled: true` in `fieldTypes` |
| Empty nested block in output | All children hidden but parent not removed — upgrade z2f |
| Per-schema override ignored | Check exact path match; per-schema takes precedence |

## CLI Commands

```bash
z2f init                    # Create z2f.config.ts
z2f generate                # Generate forms from config
z2f generate --watch        # Watch mode
z2f generate --dry-run      # Preview without writing
```

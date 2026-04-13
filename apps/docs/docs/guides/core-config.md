---
title: Core Configuration
sidebar_position: 3
description: Full defineConfig surface from @zod-to-form/core — the shared configuration consumed by both the runtime and the CLI codegen pipeline.
---

# Core Configuration

`defineConfig` from `@zod-to-form/core` is the full, top-level configuration surface
for zod-to-form. It describes everything the schema walker and codegen pipeline
need: the component barrel, the form primitive wrappers, default generation
options, schema filters, the field-type registry, and global and per-schema
field mappings.

## When to use

Use `defineConfig` when you want a single source of truth that both the
runtime (`@zod-to-form/react`) and the CLI (`@zod-to-form/cli`) can consume
to produce functionally identical forms. It is the configuration loaded from
`z2f.config.ts` by the CLI and can be imported directly by the runtime.

How it relates to `defineComponentConfig`:

- `defineComponentConfig` (see [Component Config](./component-config.md)) is the
  **narrower** surface. It only covers component mapping: the `components`
  module specifier, `formPrimitives`, and the `fieldTypes` registry — the
  bits that decide *which React component* renders each field.
- `defineConfig` is the **broader superset**. It includes everything from the
  component-config surface plus the codegen-level controls:
  `defaults`, `include`, `exclude`, `fields` (global field mappings), and
  `schemas` (per-schema overrides).

If you only need to tell the runtime which components to use, reach for
`defineComponentConfig`. If you are driving the CLI, filtering schemas, or
hiding internal fields across a whole codebase, use `defineConfig`.

## Installation and import

`defineConfig` ships from the core package:

```typescript
import { defineConfig } from '@zod-to-form/core';
```

A typical project places the config in `z2f.config.ts` at the repo root so the
`z2f` CLI can auto-discover it:

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/zod-form-components',
  formPrimitives: { field: 'Field', label: 'FieldLabel', control: 'FieldControl' },
  defaults: { mode: 'auto-save', ui: 'shadcn', overwrite: true, serverAction: false },
  include: ['UserSchema'],
  exclude: [],
  fieldTypes: { Input: { component: 'Input' } },
  fields: {},
  schemas: {},
});
```

## Full config shape

The top-level shape accepted by `defineConfig`:

```typescript
import { defineConfig } from '@zod-to-form/core';

defineConfig({
  components: string,
  formPrimitives: { field: string; label: string; control: string },
  defaults: {
    mode: 'auto-save' | 'on-submit';
    ui: string;
    overwrite: boolean;
    serverAction: boolean;
  },
  include: string[],
  exclude: string[],
  fieldTypes: Record<string, ComponentEntry>,
  fields: Record<string, FieldConfig>,
  schemas: Record<string, { fields: Record<string, FieldConfig> }>,
});
```

### `components`

- **Type:** `string`
- **Default:** none — required.
- **Purpose:** Module specifier for the barrel file that exports every form
  component referenced by `fieldTypes` and `formPrimitives`. The codegen
  emits imports from exactly this path.
- **Example:**
  ```typescript
  components: '@/components/zod-form-components';
  // Generated: import { Input, TypeSelector } from '@/components/zod-form-components';
  ```

### `formPrimitives`

- **Type:** `{ field: string; label: string; control: string }`
- **Default:** none — required. Common values are `'Field'`, `'FieldLabel'`,
  `'FieldControl'`.
- **Purpose:** Names of the wrapper components that surround every generated
  field. The `field` wraps the whole row, `label` wraps the label text, and
  `control` wraps the input.
- **Example:**
  ```typescript
  formPrimitives: {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FieldControl',
  }
  ```

  Renders as:

  ```tsx
  <Field>
    <FieldLabel htmlFor="name">Name</FieldLabel>
    <FieldControl>
      <Input id="name" {...register('name')} />
    </FieldControl>
  </Field>
  ```

### `defaults`

- **Type:** `{ mode: 'auto-save' | 'on-submit'; ui: string; overwrite: boolean; serverAction: boolean }`
- **Default:** no defaults are applied unless the field is provided — the
  source material shows `{ mode: 'auto-save', ui: 'shadcn', overwrite: true, serverAction: false }`
  as the canonical starter value.
- **Purpose:** Default generation options used by the CLI when a flag is not
  passed explicitly on the command line.
- **Fields:**
  - `mode`: `'auto-save'` wires a `watch()` subscription to `onValueChange` on
    every field change; `'on-submit'` generates a standard `onSubmit` handler.
  - `ui`: UI framework hint used by `z2f init` auto-detection heuristics (e.g.
    `'shadcn'`).
  - `overwrite`: whether `z2f generate` overwrites existing generated files.
  - `serverAction`: wrap the form in a Next.js server action.
- **Example:**
  ```typescript
  defaults: {
    mode: 'auto-save',
    ui: 'shadcn',
    overwrite: true,
    serverAction: false,
  }
  ```

### `include`

- **Type:** `string[]`
- **Default:** none — when omitted the source material does not document an
  explicit fallback; treat as "all exported schemas" until confirmed against
  the core package.
- **Purpose:** Allow-list of exported Zod schema `const` names to generate
  forms for. Names must match the exported identifier verbatim.
- **Example:**
  ```typescript
  include: ['DataSchema', 'UserSchema'];
  ```

### `exclude`

- **Type:** `string[]`
- **Default:** `[]`
- **Purpose:** Schemas to skip. Applied **after** `include`, so it can strip a
  schema that was otherwise matched by the allow-list.
- **Example:**
  ```typescript
  exclude: ['InternalSchema'];
  ```

### `fieldTypes`

- **Type:** `Record<string, ComponentEntry>`
- **Default:** none — required to resolve any `fieldType` keys used in `fields`
  or `schemas`.
- **Purpose:** Registry of every custom component type that can be referenced
  by name from field mappings. Each entry points at a component exported from
  the `components` barrel.
- **`ComponentEntry` shape:**

  | Property | Type | Description |
  |----------|------|-------------|
  | `component` | `string` | Component name (must be exported from `components` barrel). |
  | `controlled` | `boolean?` | Use the `<Controller>` pattern instead of `register()`. Required for components that do not accept `ref` (Select, Combobox, custom widgets). |
  | `propMap` | `Record<string, string>?` | Remap RHF field props onto component-specific prop names, e.g. `{ onSelect: 'field.onChange', selectedValue: 'field.value' }`. |

- **Example:**
  ```typescript
  fieldTypes: {
    Input: { component: 'Input' },
    Textarea: { component: 'Textarea' },
    Select: { component: 'Select', controlled: true },
    TypeSelector: { component: 'TypeSelector', controlled: true },
  }
  ```

### `fields`

- **Type:** `Record<string, FieldConfig>`
- **Default:** `{}`
- **Purpose:** Global field mappings applied across every schema the generator
  touches. Keys are field paths using the path syntax documented below.
- **`FieldConfig` shape:**
  ```typescript
  type FieldConfig = {
    fieldType?: string;              // Key from fieldTypes registry
    hidden?: boolean;                // Exclude from generated output entirely
    props?: Record<string, unknown>; // Extra props passed to the component
    order?: number;                  // Rendering order within array item groups
  };
  ```
- **Path syntax:**

  | Pattern | Matches |
  |---------|---------|
  | `'name'` | Top-level field |
  | `'typeCall.type'` | Nested object field |
  | `'attributes[].name'` | Field within array items |
  | `'attributes[].typeCall.type'` | Deep nested in array |

  Always use `[]` bracket notation for arrays — never `items.0.field`.

- **Example:**
  ```typescript
  fields: {
    parent: { fieldType: 'TypeSelector' },
    'attributes[].typeCall.type': { fieldType: 'TypeSelector' },
    'attributes[].card': { fieldType: 'CardinalitySelector' },
    definition: { fieldType: 'Textarea', props: { rows: 3 } },

    // Hide type discriminators and custom-rendered sections.
    $type: { hidden: true },
    'attributes[].$type': { hidden: true },
    annotations: { hidden: true },
  }
  ```

### `schemas`

- **Type:** `Record<string, { fields: Record<string, FieldConfig> }>`
- **Default:** `{}`
- **Purpose:** Per-schema overrides keyed by the exported schema const name.
  Entries take precedence over the global `fields` block for that schema
  only. Use `order` to control rendering sequence inside array item groups.
- **Example:**
  ```typescript
  schemas: {
    DataSchema: {
      fields: {
        'attributes[].name': { fieldType: 'Input', order: 1 },
        'attributes[].typeCall.type': { fieldType: 'TypeSelector', order: 2 },
        'attributes[].card': { fieldType: 'CardinalitySelector', order: 3 },
        'attributes[].override': { hidden: true },
      },
    },
  }
  ```

## Examples

### 1. Basic config

Minimal config pointing at a component barrel and generating forms for a
single schema:

```typescript
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/zod-form-components',
  formPrimitives: {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FieldControl',
  },
  defaults: {
    mode: 'on-submit',
    ui: 'shadcn',
    overwrite: true,
    serverAction: false,
  },
  include: ['UserSchema'],
  exclude: [],
  fieldTypes: {
    Input: { component: 'Input' },
    Textarea: { component: 'Textarea' },
  },
  fields: {},
  schemas: {},
});
```

### 2. With defaults and global hidden fields

Auto-save forms with a broader field-type registry and a set of globally
hidden internal fields:

```typescript
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/zod-form-components',
  formPrimitives: {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FieldControl',
  },
  defaults: {
    mode: 'auto-save',
    ui: 'shadcn',
    overwrite: true,
    serverAction: false,
  },
  include: ['DataSchema', 'ChoiceSchema'],
  exclude: [],
  fieldTypes: {
    Input: { component: 'Input' },
    Textarea: { component: 'Textarea' },
    TypeSelector: { component: 'TypeSelector', controlled: true },
    CardinalitySelector: { component: 'CardinalitySelector', controlled: true },
  },
  fields: {
    'attributes[].typeCall.type': { fieldType: 'TypeSelector' },
    'attributes[].card': { fieldType: 'CardinalitySelector' },
    definition: { fieldType: 'Textarea', props: { rows: 3 } },

    $type: { hidden: true },
    'attributes[].$type': { hidden: true },
    'attributes[].typeCall.$type': { hidden: true },
    'attributes[].typeCall.arguments': { hidden: true },
    annotations: { hidden: true },
    conditions: { hidden: true },
  },
  schemas: {},
});
```

### 3. With per-schema overrides

Global mappings plus tailored overrides for two schemas. `ChoiceSchema` hides
the `name` field that is globally mapped to `Input`:

```typescript
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/zod-form-components',
  formPrimitives: {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FieldControl',
  },
  defaults: {
    mode: 'auto-save',
    ui: 'shadcn',
    overwrite: true,
    serverAction: false,
  },
  include: ['DataSchema', 'ChoiceSchema'],
  exclude: [],
  fieldTypes: {
    Input: { component: 'Input' },
    Textarea: { component: 'Textarea' },
    TypeSelector: { component: 'TypeSelector', controlled: true },
    CardinalitySelector: { component: 'CardinalitySelector', controlled: true },
  },
  fields: {
    'attributes[].name': { fieldType: 'Input' },
    'attributes[].typeCall.type': { fieldType: 'TypeSelector' },
    'attributes[].card': { fieldType: 'CardinalitySelector' },
    $type: { hidden: true },
    'attributes[].$type': { hidden: true },
  },
  schemas: {
    DataSchema: {
      fields: {
        'attributes[].name': { fieldType: 'Input', order: 1 },
        'attributes[].typeCall.type': { fieldType: 'TypeSelector', order: 2 },
        'attributes[].card': { fieldType: 'CardinalitySelector', order: 3 },
        'attributes[].definition': { fieldType: 'Textarea', props: { rows: 2 }, order: 4 },
        'attributes[].override': { hidden: true },
      },
    },
    ChoiceSchema: {
      fields: {
        'attributes[].name': { hidden: true },
        'attributes[].typeCall.type': { fieldType: 'TypeSelector', order: 1 },
        'attributes[].definition': { fieldType: 'Textarea', props: { rows: 2 }, order: 2 },
      },
    },
  },
});
```

## Resolution precedence

When the same field has multiple configurations, the highest-priority source
wins. Based on the documented behaviour in the source skills:

1. **Per-schema overrides** (`schemas[SchemaName].fields`) — highest priority.
   Explicitly documented as taking precedence over global `fields`.
2. **Global `fields`** — applied across every generated schema.
3. **`fieldTypes` auto-detection / inferred defaults** — used when no explicit
   field mapping exists. `z2f init` populates the registry using a
   known-controlled list plus source heuristics.
4. **CLI flags** — flags passed to `z2f generate` override the corresponding
   `defaults` entries (for example `--no-overwrite` against
   `defaults.overwrite`). Field-level mappings themselves are not
   overridable from the CLI.
5. **Runtime metadata** — when the config is consumed by the runtime
   `<ZodForm>`, per-field metadata attached via Zod descriptions / registries
   at the schema level is resolved independently of `defineConfig` field
   mappings. The source material does not define a single merge order across
   `defineConfig` and runtime metadata; treat the two as complementary and
   prefer per-schema config for codegen concerns and schema metadata for
   per-field UI hints. (*Type inferred — see source skill files for the
   authoritative order.*)

## Cross-links

- [Component Config](./component-config.md) — the narrower component-mapping
  surface shared by the runtime and CLI.
- [Runtime Rendering](./runtime.md) — rendering forms from schemas at runtime
  with `<ZodForm>` and `useZodForm`.
- [CLI](./cli.md) — the `z2f generate` codegen pipeline that consumes this
  configuration.
- [Examples](./examples.md) — end-to-end snippets that combine schemas,
  configuration, and the runtime or CLI surface.

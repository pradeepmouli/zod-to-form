# z2f Configuration Reference

## Table of Contents

- [defineConfig API](#defineconfig-api)
- [components](#components)
- [formPrimitives](#formprimitives)
- [defaults](#defaults)
- [include / exclude](#include--exclude)
- [fieldTypes](#fieldtypes)
- [fields](#fields)
- [schemas](#schemas)
- [Complete Example](#complete-example)

## defineConfig API

```typescript
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: string,
  formPrimitives: { field: string, label: string, control: string },
  defaults: { mode: string, ui: string, overwrite: boolean, serverAction: boolean },
  include: string[],
  exclude: string[],
  fieldTypes: Record<string, { component: string }>,
  fields: Record<string, FieldConfig>,
  schemas: Record<string, { fields: Record<string, FieldConfig> }>
});
```

## components

Import path for the barrel file that exports all form components. Generated files import from this path.

```typescript
components: '@/components/zod-form-components'
// Generated: import { Input, TypeSelector } from '@/components/zod-form-components';
```

## formPrimitives

Wrapper components for each form field's structure:

```typescript
formPrimitives: {
  field: 'Field',     // Outer wrapper
  label: 'FieldLabel', // Label element
  control: 'FieldControl' // Input wrapper
}
```

Generated output:
```tsx
<Field>
  <FieldLabel htmlFor="name">Name</FieldLabel>
  <FieldControl>
    <Input id="name" {...register('name')} />
  </FieldControl>
</Field>
```

## defaults

```typescript
defaults: {
  mode: 'auto-save',    // 'auto-save': watch + onValueChange | 'on-submit': onSubmit handler
  ui: 'shadcn',         // UI framework hint for component selection
  overwrite: true,      // Overwrite existing generated files
  serverAction: false   // Wrap form in server action (Next.js)
}
```

## include / exclude

Filter which exported Zod schemas get forms generated:

```typescript
include: ['DataSchema', 'RosettaEnumerationSchema'], // only these
exclude: ['InternalSchema'], // never these (applied after include)
```

Schema names must match the exported `const` name from the schema file.

## fieldTypes

Register custom component types that can be referenced in field mappings:

```typescript
fieldTypes: {
  Input: { component: 'Input' },
  Textarea: { component: 'Textarea' },
  Select: { component: 'Select', controlled: true },
  TypeSelector: { component: 'TypeSelector', controlled: true },
  CardinalitySelector: { component: 'CardinalitySelector', controlled: true }
}
```

The `component` value must be exported from the `components` barrel file.

### ComponentEntry properties

| Property | Type | Description |
|----------|------|-------------|
| `component` | `string` | Component name (must be exported from `components` barrel) |
| `controlled` | `boolean?` | Use `<Controller>` pattern instead of `register()`. Required for components that don't accept `ref` (Select, Combobox, custom widgets) |
| `propMap` | `Record<string, string>?` | Remap RHF field props. E.g. `{ onSelect: 'field.onChange', selectedValue: 'field.value' }` |

`z2f init` auto-detects controlled components from known lists and source heuristics.

## fields

Global field mappings applied across all generated schemas.

### FieldConfig shape

```typescript
type FieldConfig = {
  fieldType?: string;        // Key from fieldTypes registry
  hidden?: boolean;          // Exclude from generated output entirely
  props?: Record<string, unknown>; // Extra props passed to the component
  order?: number;            // Rendering order within array item groups
};
```

### Path syntax

| Pattern | Matches | Example |
|---------|---------|---------|
| `'name'` | Top-level field | `z.object({ name: z.string() })` |
| `'typeCall.type'` | Nested object field | `z.object({ typeCall: z.object({ type: ... }) })` |
| `'attributes[].name'` | Field within array items | `z.object({ attributes: z.array(z.object({ name: ... })) })` |
| `'attributes[].typeCall.type'` | Deep nested in array | Array > object > object > field |

### Hidden field patterns

Common categories of fields to hide:

```typescript
fields: {
  // Type discriminators (internal, never user-editable)
  $type: { hidden: true },
  'attributes[].$type': { hidden: true },
  'attributes[].typeCall.$type': { hidden: true },

  // Internal arrays (managed programmatically)
  'attributes[].typeCall.arguments': { hidden: true },

  // Custom-rendered sections (handled by separate React components)
  annotations: { hidden: true },
  'attributes[].annotations': { hidden: true },
  conditions: { hidden: true },
  postConditions: { hidden: true },
  synonyms: { hidden: true },
  references: { hidden: true },
  comments: { hidden: true },

  // System fields
  'attributes[].labels': { hidden: true },
  'attributes[].ruleReferences': { hidden: true }
}
```

## schemas

Per-schema field overrides. These take precedence over global `fields`:

```typescript
schemas: {
  DataSchema: {
    fields: {
      // Control rendering order within array item groups
      'attributes[].name': { fieldType: 'Input', order: 1 },
      'attributes[].typeCall.type': { fieldType: 'TypeSelector', order: 2 },
      'attributes[].card': { fieldType: 'CardinalitySelector', order: 3 },
      'attributes[].definition': { fieldType: 'Textarea', props: { rows: 2 }, order: 4 },

      // Hide schema-specific fields
      'attributes[].override': { hidden: true }
    }
  },

  ChoiceSchema: {
    fields: {
      'attributes[].name': { hidden: true }, // Override global: hide name for choices
      'attributes[].typeCall.type': { fieldType: 'TypeSelector', order: 1 },
      'attributes[].definition': { fieldType: 'Textarea', props: { rows: 2 }, order: 2 }
    }
  }
}
```

## Complete Example

```typescript
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/zod-form-components',
  formPrimitives: {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FieldControl'
  },
  defaults: {
    mode: 'auto-save',
    ui: 'shadcn',
    overwrite: true,
    serverAction: false
  },
  include: [
    'DataSchema',
    'RosettaEnumerationSchema',
    'ChoiceSchema',
    'RosettaFunctionSchema',
    'RosettaTypeAliasSchema'
  ],
  exclude: [],
  fieldTypes: {
    CardinalitySelector: { component: 'CardinalitySelector' },
    Input: { component: 'Input' },
    Select: { component: 'Select' },
    Textarea: { component: 'Textarea' },
    TypeSelector: { component: 'TypeSelector' }
  },
  fields: {
    // Cross-reference fields
    parent: { fieldType: 'TypeSelector' },
    superType: { fieldType: 'TypeSelector' },
    'attributes[].typeCall.type': { fieldType: 'TypeSelector' },
    'typeCall.type': { fieldType: 'TypeSelector' },
    'inputs[].typeCall.type': { fieldType: 'TypeSelector' },
    'output.typeCall.type': { fieldType: 'TypeSelector' },

    // Cardinality fields
    'attributes[].card': { fieldType: 'CardinalitySelector' },
    'inputs[].card': { fieldType: 'CardinalitySelector' },
    'output.card': { fieldType: 'CardinalitySelector' },

    // Textarea fields
    definition: { fieldType: 'Textarea', props: { rows: 3 } },

    // Hidden: type discriminators
    $type: { hidden: true },
    'attributes[].$type': { hidden: true },
    'attributes[].typeCall.$type': { hidden: true },
    'attributes[].typeCall.arguments': { hidden: true },
    'enumValues[].$type': { hidden: true },
    'inputs[].$type': { hidden: true },
    'inputs[].typeCall.$type': { hidden: true },
    'inputs[].typeCall.arguments': { hidden: true },
    'typeCall.$type': { hidden: true },
    'output.$type': { hidden: true },

    // Hidden: custom-rendered sections
    annotations: { hidden: true },
    'attributes[].annotations': { hidden: true },
    'enumValues[].annotations': { hidden: true },
    conditions: { hidden: true },
    postConditions: { hidden: true },
    synonyms: { hidden: true },
    'attributes[].synonyms': { hidden: true },
    'enumValues[].enumSynonyms': { hidden: true },
    references: { hidden: true },
    'attributes[].references': { hidden: true },
    'enumValues[].references': { hidden: true },
    'attributes[].labels': { hidden: true },
    'attributes[].ruleReferences': { hidden: true },
    comments: { hidden: true }
  },
  schemas: {
    DataSchema: {
      fields: {
        'attributes[].name': { fieldType: 'Input', order: 1 },
        'attributes[].typeCall.type': { fieldType: 'TypeSelector', order: 2 },
        'attributes[].card': { fieldType: 'CardinalitySelector', order: 3 },
        'attributes[].override': { hidden: true },
        'attributes[].definition': { fieldType: 'Textarea', props: { rows: 2 }, order: 4 }
      }
    },
    ChoiceSchema: {
      fields: {
        'attributes[].name': { hidden: true },
        'attributes[].typeCall.type': { fieldType: 'TypeSelector', order: 1 },
        'attributes[].definition': { fieldType: 'Textarea', props: { rows: 2 }, order: 2 }
      }
    },
    RosettaEnumerationSchema: {
      fields: {
        'enumValues[].name': { fieldType: 'Input', order: 1 },
        'enumValues[].display': { fieldType: 'Input', order: 2 },
        'enumValues[].definition': { fieldType: 'Textarea', props: { rows: 2 }, order: 3 }
      }
    },
    RosettaFunctionSchema: {
      fields: {
        'inputs[].name': { fieldType: 'Input', order: 1 },
        'inputs[].typeCall.type': { fieldType: 'TypeSelector', order: 2 },
        'inputs[].card': { fieldType: 'CardinalitySelector', order: 3 },
        'output.name': { hidden: true },
        'output.typeCall': { fieldType: 'TypeSelector', order: 1 },
        'output.card': { fieldType: 'CardinalitySelector', order: 2 },
        shortcuts: { hidden: true }
      }
    },
    RosettaTypeAliasSchema: {
      fields: {
        'typeCall.type': { fieldType: 'TypeSelector', order: 1 },
        'typeCall.arguments': { hidden: true }
      }
    }
  }
});
```

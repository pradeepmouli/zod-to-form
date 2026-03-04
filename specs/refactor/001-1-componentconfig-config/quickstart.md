# Quickstart: New ZodFormsConfig

## Before (Old Style)

```typescript
// z2f.config.ts
import { defineComponentConfig } from '@zod-to-form/core';

export default defineComponentConfig({
  components: '@/components/ui',
  overwrite: false,
  types: [],
  include: [],
  exclude: [],
  formPrimitives: {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FieldControl'
  },
  fieldTypes: {
    Input: { component: 'Input' },
    Textarea: { component: 'Textarea' },
    Select: { component: 'Select' },
    Checkbox: { component: 'Checkbox' }
  },
  fields: {
    'email': { fieldType: 'Input' },
    'bio': { fieldType: 'Textarea', props: { rows: 5 } }
  }
});
```

## After (New Style)

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/ui',
  formPrimitives: {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FieldControl'
  },
  fieldTypes: {
    Input: { component: 'Input' },
    Textarea: { component: 'Textarea' },
    Select: { component: 'Select' },
    Checkbox: { component: 'Checkbox' }
  },

  // NEW: CLI defaults in config (no more repeating flags)
  defaults: {
    mode: 'submit',
    ui: 'shadcn',
    overwrite: false,
    serverAction: false
  },

  // Global field defaults (backward compat — same as old top-level `fields`)
  fields: {
    'email': { fieldType: 'Input' },
    'bio': { fieldType: 'Textarea', props: { rows: 5 } }
  },

  // NEW: Per-schema config with aligned FieldConfig
  schemas: {
    UserSchema: {
      name: 'UserProfileForm',
      mode: 'auto-save',
      out: './components/forms',
      fields: {
        'email': { fieldType: 'Input', order: 1 },
        'bio': { fieldType: 'Textarea', order: 2, props: { rows: 10 } }
      }
    },
    LoginSchema: {
      name: 'LoginForm',
      serverAction: true,
      fields: {
        'password': { fieldType: 'Input', props: { type: 'password' } }
      }
    }
  }
});
```

## With Type Inference

```typescript
// z2f.config.ts — type-safe schema names
import { defineConfig } from '@zod-to-form/core';

export default defineConfig<
  typeof import('@/components/ui'),
  typeof import('./schemas')
>({
  components: '@/components/ui',
  fieldTypes: { /* ... */ },
  schemas: {
    UserSchema: { /* ← autocomplete from ./schemas exports */ },
    // InvalidName: {}  ← TypeScript error: not in schema exports
  }
});
```

## Migration

No migration needed. Old configs continue to work:

1. `defineComponentConfig` → works (deprecated alias for `defineConfig`)
2. `ZodToFormComponentConfig` → works (deprecated alias for `ZodFormsConfig`)
3. Top-level `fields` → works (treated as global defaults)
4. `overwrite` at top level → works (maps to `defaults.overwrite`)

IDEs will show strikethrough on deprecated APIs, guiding users to the new names.

# Quickstart: API Surface Cleanup

## Migration Guide (for existing users)

### 1. Replace `propMap` with `props`

**Before:**
```typescript
fields: {
  country: {
    component: 'Select',
    props: { placeholder: 'Pick a country' },
    propMap: { onValueChange: 'field.onChange' }
  }
}
```

**After:**
```typescript
fields: {
  country: {
    component: 'Select',
    props: { placeholder: 'Pick a country', onValueChange: 'field.onChange' }
  }
}
```

Field expressions (`field.value`, `field.onChange`, `field.onBlur`, `field.ref`, `field.name`) are auto-detected and resolved from the form controller.

### 2. Replace `gridColumn` with `props`

**Before:**
```typescript
fields: {
  bio: { gridColumn: 'span 2' }
}
```

**After (Tailwind):**
```typescript
fields: {
  bio: { props: { className: 'col-span-2' } }
}
```

**After (inline CSS):**
```typescript
fields: {
  bio: { props: { style: { gridColumn: 'span 2' } } }
}
```

### 3. Remove `sectionComponents` from runtime config

**Before:**
```typescript
<ZodForm
  componentConfig={{
    componentModule: myComponents,
    sectionComponents: { billing: BillingSection }
  }}
/>
```

**After:**
```typescript
<ZodForm
  componentConfig={{
    componentModule: { ...myComponents, BillingSection: BillingSection }
  }}
/>
```

Section components now resolve from `componentModule` like everything else.

### 4. New: Custom field template

```typescript
// z2f.config.ts
export default defineConfig({
  components: {
    source: './components',
    preset: 'shadcn',
    fieldTemplate: './components/MyFieldTemplate', // optional override
  },
});
```

The field template receives: `children`, `label`, `description`, `helpText`, `error`, `name`, `deprecated`.

### 5. New: Object fields with custom components

```typescript
fields: {
  billing:  { component: 'TabPanel', props: { icon: 'credit-card' }, order: 1 },
  shipping: { component: 'TabPanel', props: { icon: 'truck' }, order: 2 },
}
```

Object fields now resolve their wrapper component from `componentModule`.

### 6. New: `disabled` and `helpText`

```typescript
fields: {
  email:    { disabled: true },
  password: { helpText: 'Must be at least 8 characters' },
}
```

### 7. Zero-dependency generated code

After running the CLI, you can remove `@zod-to-form/core` and `@zod-to-form/react` from your project. The generated file is fully self-contained.

## Development Setup

```bash
pnpm install
pnpm test        # Run all tests
pnpm run build   # Build all packages
```

## Build Sequence

1. `packages/core` — type changes first
2. `packages/react` — renderer changes (depends on core types)
3. `packages/codegen` — codegen changes (depends on core types)
4. Cross-package integration tests

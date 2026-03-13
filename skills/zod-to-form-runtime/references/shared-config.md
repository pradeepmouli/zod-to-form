# Shared Component Configuration

Both the runtime `<ZodForm>` and the CLI `z2f generate` accept an identical component config shape. Define the config once and use it in both paths to produce functionally identical forms.

## Config Shape

```typescript
import { defineConfig } from '@zod-to-form/core';

type ZodFormsConfig = {
  // Module specifier — npm package, relative path, or alias
  components: string;

  // Optional preset — merges default fieldTypes for the UI library
  preset?: 'shadcn' | 'unstyled';

  // Map field component types to named exports from that module
  fieldTypes: Record<string, {
    component: string;
    render?: () => Promise<unknown>;  // runtime only
    controlled?: boolean;             // use Controller instead of register()
    propMap?: Record<string, string>; // remap RHF field props
  }>;

  // Per-field overrides (highest priority)
  fields?: Record<string, {
    fieldType?: string;               // resolves through fieldTypes
    order?: number;                   // field ordering
    hidden?: boolean;                 // exclude from rendering
    gridColumn?: string;              // CSS grid column span
    props?: Record<string, unknown>;  // pass-through props
    propMap?: Record<string, string>; // per-field prop remapping
    section?: string;                 // group into a named section component
  }>;
};
```

## Defining the Config

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/ui',
  preset: 'shadcn',
  fieldTypes: {
    Input: { component: 'TextInput' },
    Textarea: { component: 'TextareaInput' },
    Select: { component: 'SelectInput', controlled: true },
    Checkbox: { component: 'CheckboxInput' },
    DatePicker: { component: 'DateInput', controlled: true },
    'cross-ref': { component: 'TypeSelector', controlled: true }
  },
  fields: {
    bio: { fieldType: 'Textarea', props: { rows: 6 } },
    'address.country': { fieldType: 'cross-ref', props: { refType: 'Country' } },
    internalId: { hidden: true }
  }
});
```

## Controlled Components

Mark a field type as `controlled: true` when the component doesn't support `ref` forwarding. The runtime uses `useController` instead of `register()`, and the CLI generates `<Controller>`.

Use `propMap` to remap RHF controller field props to your component's prop names:

```typescript
fieldTypes: {
  DatePicker: {
    component: 'MyDatePicker',
    controlled: true,
    propMap: { onSelect: 'field.onChange' }
  }
}
```

Available RHF expressions: `field.value`, `field.onChange`, `field.onBlur`, `field.ref`, `field.name`.

## Section Grouping

Group multiple fields into a single custom section component using the `section` property:

```typescript
fields: {
  source: { section: 'MetadataSection' },
  version: { section: 'MetadataSection' },
  lastUpdated: { section: 'MetadataSection' }
}
```

Fields sharing the same `section` are suppressed from individual rendering. A single `<MetadataSection fields={['source', 'version', 'lastUpdated']} />` is rendered. The section component reads/writes values via `useFormContext()`.

## Using with the CLI

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/
```

The CLI resolves the config at build time and emits static imports and JSX:

```tsx
import { TextInput, TextareaInput, TypeSelector } from '@/components/ui';

// Per-field override applied statically:
<TextareaInput id="bio" {...register('bio')} rows={6} />

// Controlled component uses Controller:
<Controller name="address.country" control={control}
  render={({ field }) => <TypeSelector {...field} refType="Country" />} />
```

## Using with the Runtime

```tsx
import { ZodForm } from '@zod-to-form/react';
import componentConfig from './z2f.config';

<ZodForm schema={userSchema} componentConfig={componentConfig} onSubmit={handleSubmit}>
  <button type="submit">Save</button>
</ZodForm>;
```

The runtime resolves the config at render time and dynamically loads components from the module path.

## Resolution Priority

Both paths use the same 3-level lookup order:

1. **Per-field override** — `config.fields['bio']` checked first. If found, its `fieldType` resolves through `fieldTypes`, and its `props` are merged into the rendered component.
2. **Field type mapping** — `config.fieldTypes['Textarea']` checked next. Maps the walker's inferred component type to a named export.
3. **Default rendering** — Falls back to built-in `<input>`, `<select>`, `<textarea>`, etc.

## Type-Safe Config

`defineConfig<TComponents>()` provides compile-time autocomplete for component names:

```typescript
import { defineConfig } from '@zod-to-form/core';

type Components = {
  TextInput: { placeholder?: string };
  TextareaInput: { rows?: number };
  SelectInput: { options?: string[] };
  TypeSelector: { refType?: string };
};

export default defineConfig<Components>({
  components: '@/components/ui',
  fieldTypes: {
    Input: { component: 'TextInput' },
    Textarea: { component: 'TextareaInput' }
  },
  fields: {
    bio: { fieldType: 'Textarea', props: { rows: 6 } }
  }
});
```

## Extending a Base Preset (e.g. shadcn/ui)

Use `preset: 'shadcn'` to merge shadcn defaults into your `fieldTypes`:

```typescript
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/ui',
  preset: 'shadcn',
  fieldTypes: {
    DatePicker: { component: 'MyDatePicker', controlled: true },
    Textarea: { component: 'MyRichTextEditor' }
  },
  fields: {
    bio: { fieldType: 'Textarea', props: { rows: 6 } }
  }
});
```

### Runtime — shadcn base + config overrides

```tsx
import { shadcnComponentMap } from '@zod-to-form/react/shadcn';
import componentConfig from './z2f.config';

<ZodForm
  schema={schema}
  components={shadcnComponentMap}
  componentConfig={componentConfig}
  onSubmit={handleSubmit}
>
  <button type="submit">Save</button>
</ZodForm>;
```

### CLI — preset + config

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/
```

In both paths, `componentConfig` field/type overrides take precedence. Unmatched fields resolve through the base component map (shadcn preset), then fall back to built-in HTML elements.

## When to Use Shared Config

- Use the same config for both paths when prototyping with runtime and deploying with codegen.
- Start with `<ZodForm>` + `componentConfig` during development for instant feedback.
- Switch to `z2f generate --config` for production to eliminate the runtime dependency.
- The generated output uses the exact same components and props — so the forms are functionally identical.

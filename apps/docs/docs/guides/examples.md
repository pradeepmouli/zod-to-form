---
title: Examples
sidebar_position: 5
description: End-to-end examples for every feature, toggled between runtime <ZodForm> and CLI codegen paths.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Examples

Every feature below is shown twice — once as a runtime `<ZodForm>` snippet, once as a CLI `z2f generate` invocation with an excerpt of the emitted `.tsx`. Pick the tab that matches how you're using zod-to-form; your choice syncs across the page.

New to the library? Start with the [Quick Start](../quickstart.md), then come back here for feature-by-feature recipes. Cross-references: [Runtime](./runtime.md), [CLI](./cli.md), [Core Config](./core-config.md), [Component Config](./component-config.md).

See also: [AOT Optimization](./optimization.md) for validation performance tuning (L1/L2/L3, custom optimizers, typed `FieldConfig`).

## 1. Basic form

The simplest possible schema rendered as a form.

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```tsx
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export function SignupForm() {
  return (
    <ZodForm schema={signupSchema} onSubmit={(data) => save(data)}>
      <button type="submit">Sign Up</button>
    </ZodForm>
  );
}
```

</TabItem>
<TabItem value="codegen" label="CLI codegen">

```bash
npx z2f generate \
  --schema src/schemas/signup.ts \
  --export signupSchema \
  --config z2f.config.ts \
  --out src/components/
```

Generated excerpt:

```tsx
// src/components/SignupForm.tsx (generated)
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { StripIndexSignature } from '@zod-to-form/core';
import { signupSchema } from '../schemas/signup';

type FormData = StripIndexSignature<z.output<typeof signupSchema>>;

export function SignupForm(props: {
  onSubmit: (data: FormData) => void;
  values?: Partial<FormData>;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(signupSchema),
    ...(props.values && { values: props.values }),
  });
  const { register, handleSubmit } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(props.onSubmit)}>
        {/* name / email / role fields */}
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

</TabItem>
</Tabs>

Takeaway: one schema, one invocation — both paths infer input types, labels, and validation.

## 2. Metadata annotations

Control rendering via Zod v4's native registry and `.meta()` API.

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```tsx
import type { FormMeta } from '@zod-to-form/core';
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const formRegistry = z.registry<FormMeta>();

const schema = z.object({
  name: z.string().meta({ title: 'Full Name' }),
  email: z.string().email().meta({ examples: ['alice@example.com'] }),
  bio: z.string().optional(),
});

formRegistry.add(schema.shape.bio, { component: 'Textarea' });

<ZodForm schema={schema} formRegistry={formRegistry} onSubmit={handleSubmit}>
  <button type="submit">Save</button>
</ZodForm>
```

</TabItem>
<TabItem value="codegen" label="CLI codegen">

Schema file (same `.meta()` + registry calls), then:

```bash
npx z2f generate \
  --schema src/schemas/profile.ts \
  --export profileSchema \
  --config z2f.config.ts \
  --out src/components/
```

The CLI reads `.meta()` labels and registry entries at build time and bakes them into the emitted JSX — e.g. `<label htmlFor="name">Full Name</label>` and a `<Textarea>` element for `bio`.

</TabItem>
</Tabs>

Takeaway: `.meta()` and `z.registry<FormMeta>()` are the idiomatic, Zod v4-native way to annotate fields — no custom refinements.

## 3. shadcn/ui components

Use the built-in shadcn component map.

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```tsx
import { ZodForm } from '@zod-to-form/react';
import { shadcnComponentMap } from '@zod-to-form/react/shadcn';

<ZodForm schema={schema} components={shadcnComponentMap} onSubmit={handleSubmit}>
  <button type="submit">Save</button>
</ZodForm>
```

</TabItem>
<TabItem value="codegen" label="CLI codegen">

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },
});
```

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/
```

The emitted `.tsx` imports shadcn components (`Input`, `Select`, etc.) from `@/components/ui`.

</TabItem>
</Tabs>

Takeaway: `preset: 'shadcn'` in config is equivalent to passing `shadcnComponentMap` at runtime.

## 4. Custom components (extending shadcn)

Keep shadcn as the base, override specific fields with your own components.

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
    overrides: {
      MyDatePicker: { controlled: true },
    },
  },
  fields: {
    birthday: { component: 'MyDatePicker' },
    bio: { component: 'MyRichTextEditor', props: { rows: 6 } },
  },
});
```

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
</ZodForm>
```

</TabItem>
<TabItem value="codegen" label="CLI codegen">

Same `z2f.config.ts` as the runtime tab, then:

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/
```

Fields matched by the config get your custom components; everything else renders with shadcn defaults.

</TabItem>
</Tabs>

Takeaway: one config file, both paths — matched fields use overrides, the rest fall back to shadcn.

## 5. Controlled components

For components that don't support `ref` forwarding (custom selects, date pickers), mark them `controlled: true`. Optional `propMap` remaps RHF field props to your component's API.

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    overrides: {
      MySelect: { controlled: true },
      MyDatePicker: {
        controlled: true,
        propMap: { onSelect: 'field.onChange' },
      },
    },
  },
  fields: {
    role: { component: 'MySelect' },
    birthDate: { component: 'MyDatePicker' },
  },
});
```

Runtime uses `useController` internally — no adapter wrappers needed.

</TabItem>
<TabItem value="codegen" label="CLI codegen">

Same `z2f.config.ts`. The CLI emits a `<Controller>` wrapper:

```tsx
<Controller name="role" control={control}
  render={({ field }) => <MySelect value={field.value} onChange={field.onChange} />} />
```

With `propMap`, RHF field props are remapped (e.g., `field.onChange` becomes `onSelect`).

</TabItem>
</Tabs>

Takeaway: `controlled: true` handles the `ref`-forwarding gap without you writing `forwardRef` adapters.

## 6. Hidden fields

Hide a field from rendering while keeping it in the schema and form state.

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```typescript
// In z2f.config.ts
export default defineConfig({
  fields: {
    internalId: { hidden: true },
  },
});
```

The runtime suppresses the field but preserves its value in form state.

</TabItem>
<TabItem value="codegen" label="CLI codegen">

Same config. The CLI omits the field from rendered JSX while keeping it in the RHF `FormData` type.

</TabItem>
</Tabs>

Takeaway: `hidden: true` is the right switch for bookkeeping fields (IDs, tenant tokens) that must flow through the form without being shown.

## 7. Section grouping

Group multiple fields into a single custom section component.

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```typescript
// In z2f.config.ts
export default defineConfig({
  fields: {
    source: { section: 'MetadataSection' },
    version: { section: 'MetadataSection' },
    lastUpdated: { section: 'MetadataSection' },
  },
});
```

Individual fields are suppressed. A single `<MetadataSection fields={['source', 'version', 'lastUpdated']} />` is rendered. The section component reads/writes values via `useFormContext()`.

</TabItem>
<TabItem value="codegen" label="CLI codegen">

Same config. The CLI emits one `<MetadataSection>` element with the `fields` prop baked in.

</TabItem>
</Tabs>

Takeaway: section grouping delegates layout to a custom component while still letting zod-to-form own field discovery.

## 8. Per-schema overrides

Override field config for specific schemas without affecting the global defaults.

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: { source: '@/components/ui', preset: 'shadcn' },
  fields: {
    description: { component: 'Textarea' }, // global default
  },
  schemas: {
    userSchema: {
      name: 'UserForm',
      mode: 'auto-save',
      fields: {
        description: { component: 'Input' }, // override for this schema only
      },
    },
  },
});
```

</TabItem>
<TabItem value="codegen" label="CLI codegen">

Same config. When you run `z2f generate --export userSchema`, the CLI merges the `schemas.userSchema` block on top of the global `fields` block.

</TabItem>
</Tabs>

Takeaway: use global `fields` for cross-cutting defaults; use `schemas[name]` when one form needs to diverge.

## 9. Shared component configuration

One `z2f.config.ts` drives both paths — this section makes the parity explicit.

```typescript
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
    overrides: {
      SelectInput: { controlled: true },
      DateInput: { controlled: true },
      TypeSelector: { controlled: true },
    },
  },
  fields: {
    bio: { component: 'TextareaInput', props: { rows: 6 } },
    'address.country': { component: 'TypeSelector', props: { refType: 'Country' } },
  },
});
```

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```tsx
import { ZodForm } from '@zod-to-form/react';
import componentConfig from './z2f.config';

<ZodForm
  schema={userSchema}
  componentConfig={componentConfig}
  onSubmit={handleSubmit}
>
  <button type="submit">Save</button>
</ZodForm>
```

</TabItem>
<TabItem value="codegen" label="CLI codegen">

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/
```

The generated file contains:

```tsx
import { TextareaInput, TypeSelector } from '@/components/ui';

// ...
<TextareaInput id="bio" {...register('bio')} rows={6} />

<Controller name="address.country" control={control}
  render={({ field }) => <TypeSelector {...field} refType="Country" />} />
```

</TabItem>
</Tabs>

Both paths resolve the config in the same priority order:

1. Per-field override (`config.fields['bio']`) — highest
2. Component override (`config.components.overrides['MySelect']`) — controlled, propMap
3. Default rendering — built-in `<input>`, `<select>`, etc.

The only difference is *when* resolution happens — build time (CLI) vs render time (runtime). The resulting form structure, field mapping, and override props are identical.

## 10. Nested objects and arrays

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```typescript
import { z } from 'zod';

const orderSchema = z.object({
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  items: z.array(
    z.object({ product: z.string(), quantity: z.number().min(1) })
  ).min(1),
});
```

```tsx
<ZodForm schema={orderSchema} onSubmit={handleSubmit}>
  <button type="submit">Place Order</button>
</ZodForm>
```

Renders a `customer` fieldset group and an `items` repeater with add/remove controls. Remove is disabled when the minimum count is reached.

</TabItem>
<TabItem value="codegen" label="CLI codegen">

```bash
npx z2f generate \
  --schema src/schemas/order.ts \
  --export orderSchema \
  --config z2f.config.ts \
  --out src/components/
```

The CLI emits a nested fieldset for `customer` and a `useFieldArray`-driven repeater for `items`, with the `.min(1)` constraint wired into the remove-button disabled state.

</TabItem>
</Tabs>

Takeaway: nested objects become fieldsets, arrays become repeaters — schema constraints (`.min`, `.max`) drive the UI affordances.

## 11. Discriminated unions

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```typescript
import { z } from 'zod';

const paymentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('credit_card'), cardNumber: z.string() }),
  z.object({ type: z.literal('paypal'), email: z.string().email() }),
]);
```

```tsx
<ZodForm schema={paymentSchema} onSubmit={handleSubmit}>
  <button type="submit">Pay</button>
</ZodForm>
```

Renders a select for `type`, then reveals only the fields for the selected variant.

</TabItem>
<TabItem value="codegen" label="CLI codegen">

```bash
npx z2f generate \
  --schema src/schemas/payment.ts \
  --export paymentSchema \
  --config z2f.config.ts \
  --out src/components/
```

The generated component watches the discriminator field and conditionally renders the matching variant's fields.

</TabItem>
</Tabs>

Takeaway: discriminated unions are first-class — the discriminator renders as a select and the variant-specific fields reveal below it.

## 12. Auto-save mode

<Tabs groupId="mode">
<TabItem value="runtime" label="Runtime <ZodForm>">

```tsx
import { useZodForm } from '@zod-to-form/react';

function SettingsForm() {
  const { form, fields } = useZodForm(settingsSchema, {
    mode: 'onChange',
    onValueChange: (values) => persist(values),
  });
  // form.watch(), form.setValue(), form.formState all available
  return <pre>{JSON.stringify(fields, null, 2)}</pre>;
}
```

</TabItem>
<TabItem value="codegen" label="CLI codegen">

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --mode auto-save
```

Generated excerpt:

```tsx
// Generated in auto-save mode
import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { StripIndexSignature } from '@zod-to-form/core';
import { userSchema } from '../schemas/user';

type FormData = StripIndexSignature<z.output<typeof userSchema>>;

export function UserForm(props: {
  onValueChange?: (data: FormData) => void;
  values?: Partial<FormData>;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(userSchema),
    mode: 'onChange',
    ...(props.values && { values: props.values }),
  });
  const { register, watch } = form;

  useEffect(() => {
    const subscription = watch((values) => {
      props.onValueChange?.(values as FormData);
    });
    return () => subscription.unsubscribe();
  }, [watch, props.onValueChange]);

  return (
    <FormProvider {...form}>
      <form>
        {/* fields — no submit button */}
      </form>
    </FormProvider>
  );
}
```

</TabItem>
</Tabs>

Takeaway: auto-save drops the submit button and fires `onValueChange` on every validated change.

## 13. Server action (Next.js)

```bash
npx z2f generate --schema src/schemas/user.ts --export userSchema --config z2f.config.ts --server-action
```

*CLI only — server actions are a build-time codegen output (a colocated `.ts` file with `'use server'`), so the runtime `<ZodForm>` path does not apply.*

## 14. Watch mode (dev ergonomics)

```bash
npx z2f generate --schema src/schemas/user.ts --export userSchema --config z2f.config.ts --watch
```

*CLI only — `--watch` re-runs the generator whenever the schema module changes. The runtime renderer already re-reads the schema on every render, so it has no equivalent flag.*

## 15. Custom processors

Advanced: override a processor in the core walker to customize how a Zod type becomes a `FormField`.

```typescript
import { z } from 'zod';
import { walkSchema } from '@zod-to-form/core';
import { processString } from '@zod-to-form/core/processors';
import type { FormProcessor } from '@zod-to-form/core';

const uppercaseStringProcessor: FormProcessor = (schema, ctx, field, params) => {
  processString(schema, ctx, field, params);
  field.component = 'Input';
  field.props['textTransform'] = 'uppercase';
};

const schema = z.object({
  name: z.string().min(1),
});

const fields = walkSchema(schema, {
  processors: {
    string: uppercaseStringProcessor,
  },
});
```

*Runtime only by convention — custom processors are composed with `walkSchema()` directly, typically behind `useZodForm` or a bespoke renderer. The CLI codegen consumes its processors from a fixed registry.*

---

## See also

- [Quick Start](../quickstart.md) — install and render in under a minute
- [Runtime Rendering](./runtime.md) — full `<ZodForm>` / `useZodForm` reference
- [CLI Codegen](./cli.md) — `z2f generate` flag reference
- [Core Config](./core-config.md) — `defineConfig` shape and priority rules
- [Component Config](./component-config.md) — sharing one config across runtime and CLI

<p align="center">
  <img src="./attached_assets/banner.svg" alt="zod-to-form banner" />
</p>

<p align="center">
  <strong>Schema-driven form generation for Zod v4.</strong><br>
  Walk a Zod schema once — render a validated form at runtime or generate a static, hand-readable <code>.tsx</code> component at build time.
</p>

```tsx
import { ZodForm } from '@zod-to-form/react';

<ZodForm schema={userSchema} onSubmit={(data) => console.log(data)}>
  <button type="submit">Submit</button>
</ZodForm>
```

## Packages

| Package | Description |
|---|---|
| [`@zod-to-form/core`](packages/core) | Schema walker & processor registry — zero runtime deps |
| [`@zod-to-form/react`](packages/react) | `<ZodForm>` runtime renderer + shadcn/ui component map |
| [`@zod-to-form/cli`](packages/cli) | `z2f generate` CLI for static codegen |

## Get Started

There are two ways to use zod-to-form. Pick one or use both — they share the same core walker and produce identical form behavior.

### Path A: Runtime rendering

Install and render a form in under a minute. Define a Zod schema, pass it to `<ZodForm>`, done.

```bash
pnpm add @zod-to-form/core @zod-to-form/react zod react react-hook-form @hookform/resolvers
```

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

`<ZodForm>` reads the schema, infers input types, derives labels, wires validation, and renders the form — no manual field mapping.

### Path B: CLI codegen

Generate a static `.tsx` component at build time. The output reads like hand-written code, imports only `react-hook-form` and your UI library, and has zero runtime dependency on zod-to-form.

```bash
pnpm add -D @zod-to-form/cli zod
```

```bash
npx z2f generate --schema src/schemas/signup.ts --export signupSchema --config z2f.config.ts --out src/components/
```

This produces `src/components/SignupForm.tsx` — inspect it, customize it, commit it. Regenerate with `--watch` during development.

### When to use which?

| | Runtime `<ZodForm>` | CLI `z2f generate` |
|---|---|---|
| **Best for** | Rapid prototyping, admin panels, CRUD forms | Production forms, design system integration |
| **Output** | React component at runtime | Static `.tsx` file you own |
| **Schema changes** | Instant — form updates on re-render | Regenerate with `--watch` or CI step |
| **Bundle impact** | Includes `@zod-to-form/core` + `react` package | Zero — generated code stands alone |

---

## Usage

### Runtime — `<ZodForm>`

```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18).optional(),
  role: z.enum(['admin', 'editor', 'viewer']),
  bio: z.string().optional(),
  newsletter: z.boolean().default(false),
});
```

```tsx
import { ZodForm } from '@zod-to-form/react';

function App() {
  return (
    <ZodForm
      schema={userSchema}
      onSubmit={(data) => console.log(data)} // typed as z.infer<typeof userSchema>
    >
      <button type="submit">Create User</button>
    </ZodForm>
  );
}
```

Renders a complete form with correct input types, labels derived from field names, and validation errors from the Zod schema — no manual wiring required.

### Metadata Annotations

Control rendering via Zod v4's native registry API:

```typescript
import type { FormMeta } from '@zod-to-form/core';

const formRegistry = z.registry<FormMeta>();

const schema = z.object({
  name: z.string().meta({ title: 'Full Name' }),
  email: z.string().email().meta({ examples: ['alice@example.com'] }),
  bio: z.string().optional(),
});

formRegistry.add(schema.shape.bio, { component: 'Textarea' });
```

```tsx
<ZodForm schema={schema} formRegistry={formRegistry} onSubmit={handleSubmit}>
  <button type="submit">Save</button>
</ZodForm>
```

### shadcn/ui Components

```tsx
import { ZodForm } from '@zod-to-form/react';
import { shadcnComponentMap } from '@zod-to-form/react/shadcn';

<ZodForm schema={schema} components={shadcnComponentMap} onSubmit={handleSubmit}>
  <button type="submit">Save</button>
</ZodForm>
```

#### Extending shadcn with custom components

Use a shared component config to keep shadcn as the base while overriding specific field types with your own components. The same config file drives both the runtime and CLI — see [Shared Component Configuration](#shared-component-configuration).

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
    bio: { component: 'MyRichTextEditor', props: { rows: 6 } },
  },
});
```

**Runtime** — pass shadcn as the base and the config for overrides:

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

**CLI** — `preset: 'shadcn'` provides the base, config applies overrides:

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/
```

Fields matched by the config get your custom components; everything else renders with shadcn defaults.

### CLI Code Generation

Generate a static `.tsx` form component that has **zero runtime dependency** on zod-to-form:

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/ \
  --name UserForm
```

This produces a file like the following — notice it imports only `react-hook-form`, `@hookform/resolvers`, and your schema. No `@zod-to-form/*` runtime imports appear in the output:

```tsx
// src/components/UserForm.tsx (generated)
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { StripIndexSignature } from '@zod-to-form/core';
import { userSchema } from '../schemas/user';
import { Input, Select } from '@/components/ui';

type FormData = StripIndexSignature<z.output<typeof userSchema>>;

export function UserForm(props: {
  onSubmit: (data: FormData) => void;
  values?: Partial<FormData>;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(userSchema),
    ...(props.values && { values: props.values }),
  });
  const { register, handleSubmit } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(props.onSubmit)}>
        <div>
          <label htmlFor="name">Name</label>
          <Input id="name" type="text" {...register('name')} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <Input id="email" type="email" {...register('email')} />
        </div>
        <div>
          <label htmlFor="role">Role</label>
          <Select id="role" {...register('role')}>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </Select>
        </div>
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

The generated code reads like something you'd write by hand. Inspect it, customize it, commit it.

**Auto-save mode** generates a `watch` + `useEffect` pattern instead of `handleSubmit`:

```bash
npx z2f generate --schema src/schemas/user.ts --export userSchema --config z2f.config.ts --mode auto-save
```

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

**With Next.js server action:**

```bash
npx z2f generate --schema src/schemas/user.ts --export userSchema --config z2f.config.ts --server-action
```

**Watch mode** (re-generates on schema changes):

```bash
npx z2f generate --schema src/schemas/user.ts --export userSchema --config z2f.config.ts --watch
```

### Controlled Components

When a component doesn't support `ref` forwarding (custom selects, date pickers, etc.), mark it as `controlled: true` in the config. Both the CLI and runtime handle this automatically:

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
        propMap: { onSelect: 'field.onChange' }, // remap RHF props
      },
    },
  },
  fields: {
    role: { component: 'MySelect' },
    birthDate: { component: 'MyDatePicker' },
  },
});
```

**CLI** generates `<Controller>` wrapper:

```tsx
<Controller name="role" control={control}
  render={({ field }) => <MySelect value={field.value} onChange={field.onChange} />} />
```

**Runtime** uses `useController` internally — no adapter wrappers needed.

With `propMap`, RHF field props are remapped to your component's API (e.g., `field.onChange` → `onSelect`).

### Hidden Fields

Hide a field from rendering while keeping it in the schema and form state. Set `hidden` on a field in the config:

```typescript
// In z2f.config.ts fields:
fields: {
  internalId: { hidden: true }
}
```

### Section Grouping

Group multiple fields into a single custom section component. Set `section` on fields in the config:

```typescript
// In z2f.config.ts fields:
fields: {
  source: { section: 'MetadataSection' },
  version: { section: 'MetadataSection' },
  lastUpdated: { section: 'MetadataSection' }
}
```

Fields with a `section` value are suppressed individually. A single `<MetadataSection fields={['source', 'version', 'lastUpdated']} />` is rendered. The section component receives field names and reads/writes values via `useFormContext()`.

### Per-Schema Overrides

Override field config for specific schemas:

```typescript
export default defineConfig({
  components: { source: '@/components/ui', preset: 'shadcn' },
  fields: {
    description: { component: 'Textarea' } // global default
  },
  schemas: {
    userSchema: {
      name: 'UserForm',
      mode: 'auto-save',
      fields: {
        description: { component: 'Input' } // override for this schema only
      }
    }
  }
});
```

### Shared Component Configuration

Both the runtime renderer and the CLI codegen accept the **same component config shape**. Define it once, use it in both paths — the forms are functionally identical.

**1. Define the config:**

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

**2a. Use with the CLI** — generates static imports and JSX:

```bash
npx z2f generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --config z2f.config.ts \
  --out src/components/
```

The generated file will contain:

```tsx
// Static imports resolved from your config
import { TextareaInput, TypeSelector } from '@/components/ui';

// ...
<TextareaInput id="bio" {...register('bio')} rows={6} />

// Controlled component generates Controller wrapper:
<Controller name="address.country" control={control}
  render={({ field }) => <TypeSelector {...field} refType="Country" />} />
```

**2b. Use with the runtime** — loads the same components dynamically:

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

Both paths resolve the same config in the same priority order:

1. **Per-field override** (`config.fields['bio']`) — highest priority
2. **Field type mapping** (`config.fieldTypes['Textarea']`) — fallback
3. **Default rendering** — built-in `<input>`, `<select>`, etc.

The difference is only in *when* resolution happens: the CLI resolves at build time and emits static code, the runtime resolves at render time and loads components dynamically. The resulting form structure, field mapping, and override props are identical.

### Nested Objects and Arrays

```typescript
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

Renders a `customer` fieldset group and an `items` repeater with add/remove controls. Remove is disabled when the minimum count is reached.

### Discriminated Unions

```typescript
const paymentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('credit_card'), cardNumber: z.string() }),
  z.object({ type: z.literal('paypal'), email: z.string().email() }),
]);
```

Renders a select for `type`, then reveals only the fields for the selected variant.

## Supported Zod Types

`string` · `number` · `boolean` · `date` · `enum` · `literal` · `file` · `object` · `array` · `tuple` · `union` · `discriminatedUnion` · `intersection` · `nullable` · `optional` · `default` · `pipe` · `readonly` · `lazy` (cycle-safe)

## Architecture

```
@zod-to-form/core     schema.def (fallback _zod.def) → FormField[]   (zero deps, Zod peer)
@zod-to-form/react    FormField[] → <ZodForm>          (React + RHF peers)
@zod-to-form/cli      FormField[] → UserForm.tsx       (static codegen, no runtime dep)
```

The core walker dispatches by `def.type` to a processor registry. Each processor reads `schema.def` (with `_zod.def` fallback) for structure and `schema._zod.bag` for constraint data, writing into a `FormField` descriptor. The same `FormField[]` tree drives both the runtime renderer and the CLI codegen — ensuring identical behavior (SC-003).

## Custom Processors

You can import built-in processors from the public entrypoint and override specific schema types.

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
  name: z.string().min(1)
});

const fields = walkSchema(schema, {
  processors: {
    string: uppercaseStringProcessor
  }
});
```

You can also annotate specific fields through a `ZodFormRegistry` and combine that metadata with processors.

```typescript
import { z } from 'zod';
import { walkSchema, type FormMeta } from '@zod-to-form/core';

const formRegistry = z.registry<FormMeta>();

const schema = z.object({
  title: z.string(),
  superType: z.string()
});

formRegistry.add(schema.shape.title, {
  component: 'Textarea',
  order: 1
});

formRegistry.add(schema.shape.superType, {
  component: 'TypeSelector',
  props: { refType: 'Data' }
});

const fields = walkSchema(schema, { formRegistry });
```

## Why zod-to-form?

The Zod-to-form generation space has one dominant player ([AutoForm](https://github.com/vantezzen/autoform)) and several smaller entrants. **None use the substrate API that Zod v4 explicitly designed for library authors**, and none offer build-time codegen.

### Comparison

| Capability | AutoForm | uniforms | SnowForm | react-formgen | **zod-to-form** |
|---|:---:|:---:|:---:|:---:|:---:|
| Zod v4 `_zod` substrate API | | | | | **Yes** |
| Zod v4 `.meta()` / `z.registry()` | | | | | **Yes** |
| Build-time static codegen | | | | | **Yes** |
| React Hook Form integration | Yes | | Yes | | **Yes** |
| shadcn/ui support | Yes | | Via registration | Via templates | **Yes** |
| Multi-UI-library pluggable | Yes | Yes | Yes | Yes | **Yes** |
| Nested objects | Yes | Yes | | Yes | **Yes** |
| Array fields (add/remove) | Partial | Yes | | Yes | **Yes** |
| Controlled component support | | | | | **Yes** |
| Section field grouping | | | | | **Yes** |
| Zero-dependency core | | | | | **Yes** |
| Server action generation | | | | | **Yes** |

### How we differ from each

<details>
<summary><strong>vs AutoForm</strong> (~165K npm/month, 3.4K stars)</summary>

- **Incomplete v4 support** — still reads `_def` (Zod v3 internals) instead of the `_zod` substrate API Zod v4 provides for library authors.
- **Custom annotation approach** — uses `fieldConfig()` injected via `.superRefine()` to piggyback metadata on the refinement system. Zod v4's native `.meta()` and `z.registry()` make this unnecessary.
- **Runtime only** — no option to generate static `.tsx` files.
</details>

<details>
<summary><strong>vs uniforms</strong> (~68K npm/month core, 2K stars)</summary>

- **Zod is second-class** — the Zod bridge has only ~1.2K downloads/month, targets Zod v3 only, and has no v4 support.
- **No shadcn/ui theme** — available themes (AntD, Bootstrap, MUI, Semantic) don't include today's dominant React component library.
- **Heavy dependencies** — requires `invariant`, `lodash`, `tslib` even for the bridge.
- **Meteor-era API** — `AutoForm`/`AutoField`/`SubmitField` reflects SimpleSchema origins; modern React patterns feel bolted on.
</details>

<details>
<summary><strong>vs SnowForm</strong> (~920 npm/month, 11 stars)</summary>

- **Global singleton** — `setupSnowForm()` uses a module-level global, problematic for testing, SSR, and multi-config apps.
- **Limited type coverage** — limited support for array/object/union/discriminatedUnion handling.
- **No Zod v4 metadata** — uses its own override system rather than `.meta()` or `z.registry()`.
</details>

<details>
<summary><strong>vs react-formgen</strong> (~180 npm/month, 68 stars)</summary>

- **Zustand instead of RHF** — loses the entire React Hook Form ecosystem: `zodResolver`, `useFieldArray`, validation modes, focus management, dirty/touched tracking.
- **Too headless** — zero default UI means every user builds from scratch.
</details>

### Core differentiators

The three capabilities no competitor offers are what define zod-to-form:

1. **Zod v4 native introspection** — reads `def` (with `_zod.def` fallback), reads `_zod.bag`, uses `.meta()` and `z.registry()` — aligned with Zod v4 internals and no invented IR.
2. **Build-time codegen** — generates readable `.tsx` files you can inspect, modify, and commit. Aligns with the "copy into your project" philosophy (shadcn/ui, Tailwind over CSS-in-JS).
3. **Zero-dependency core** — `@zod-to-form/core` has zero runtime dependencies (Zod is a peer). The same `FormField[]` drives both runtime rendering and static codegen.

## FAQ

<details>
<summary><strong>Does this replace <code>zodResolver</code>?</strong></summary>

No — it builds on top of it. `@zod-to-form/react` uses `zodResolver` from `@hookform/resolvers` internally to connect your Zod schema to React Hook Form's validation. You still get the same Zod validation you're used to; zod-to-form adds the **form generation** layer (field inference, component mapping, layout) that `zodResolver` doesn't provide.

If you're already using `react-hook-form` + `zodResolver` and manually writing `<Controller>` / `register()` calls for each field, zod-to-form automates that wiring.
</details>

<details>
<summary><strong>Does this work with Zod v3?</strong></summary>

No. zod-to-form targets **Zod v4 only** (`zod@^4.0.0`). It relies on Zod v4's `_zod` substrate API, `.meta()`, and `z.registry()` — none of which exist in v3. If you're on Zod v3, consider [AutoForm](https://github.com/vantezzen/autoform) or [uniforms](https://github.com/vazco/uniforms) until you upgrade.
</details>

<details>
<summary><strong>Can I use my own components (shadcn/ui, MUI, custom)?</strong></summary>

Yes. There are two approaches:

- **Runtime:** Pass a `components` map to `<ZodForm>` that maps field types to your React components. A `shadcnComponentMap` is included out of the box. Extend it with a shared config file that overrides specific field types — see [Extending shadcn with custom components](#extending-shadcn-with-custom-components).
- **CLI:** Use `components.preset: 'shadcn'` (default) or `'unstyled'`, and provide a `--config` file to map fields to your own component imports.

Both paths accept the same config shape — you can define your component mapping once and share it across runtime and CLI. See [Shared Component Configuration](#shared-component-configuration) for a full example.
</details>

<details>
<summary><strong>What about components that don't support ref forwarding?</strong></summary>

Mark them as `controlled: true` in the config's `components.overrides`. The CLI generates a `<Controller>` wrapper, and the runtime uses `useController` — no manual `forwardRef` adapters needed. Use `propMap` to remap RHF field props to your component's API. See [Controlled Components](#controlled-components).
</details>

<details>
<summary><strong>Can I still use <code>useForm()</code> / <code>useFieldArray()</code> directly?</strong></summary>

Yes. The `useZodForm()` hook returns the underlying React Hook Form `form` instance, so you have full access to `form.watch()`, `form.setValue()`, `form.formState`, and everything else from RHF. zod-to-form doesn't wrap or hide the form state — it just automates the initial wiring.
</details>

<details>
<summary><strong>What's the difference between runtime rendering and CLI codegen?</strong></summary>

**Runtime (`<ZodForm>`)** reads your schema at render time and generates the form dynamically. Great for rapid iteration — change the schema and the form updates instantly.

**CLI (`z2f generate`)** reads your schema at build time and outputs a static `.tsx` file. The generated file has zero dependency on zod-to-form at runtime — it imports only `react-hook-form` and your UI components. You own the output and can hand-edit it.

Both use the same `@zod-to-form/core` walker, so they produce identical field structures. Use runtime for speed, CLI for control. See the [Shared Component Configuration](#shared-component-configuration) section for how to use a single config file to make both paths produce functionally identical forms.
</details>

<details>
<summary><strong>Does the CLI-generated code stay in sync with schema changes?</strong></summary>

Use `--watch` mode during development — it re-generates the `.tsx` file whenever the schema module changes. In CI, add a `z2f generate` step to your build pipeline. The generated file is meant to be committed, so you can review diffs when the schema evolves.
</details>

<details>
<summary><strong>How does this handle arrays and nested objects?</strong></summary>

Both runtime and CLI support nested `z.object()` (rendered as fieldset groups) and `z.array()` (rendered as repeaters with add/remove controls). Array minimum/maximum constraints from the schema are respected — e.g., `.min(1)` disables the remove button when only one item remains. See the [Nested Objects and Arrays](#nested-objects-and-arrays) section for an example.
</details>

## Development

```bash
pnpm install        # Install dependencies
pnpm test           # Run all tests (260 tests across 3 packages)
pnpm run type-check # TypeScript strict mode check
pnpm run lint       # oxlint
pnpm run build      # Build all packages
pnpm run format     # oxfmt
```

## Project Structure

```
packages/
├── core/    # @zod-to-form/core  — schema walker & processors
├── react/   # @zod-to-form/react — <ZodForm> runtime renderer
└── cli/     # @zod-to-form/cli   — z2f generate CLI
skills/
├── zod-to-form/         # Unified skill (for npx skills add)
├── zod-to-form-cli/     # CLI-specific skill
└── zod-to-form-runtime/ # Runtime-specific skill
specs/
└── 001-zodform/  # Feature spec, plan, tasks, contracts
docs/
└── DEVELOPMENT.md · TESTING.md · WORKSPACE.md
```

## Documentation

- [Development Workflow](docs/DEVELOPMENT.md)
- [Testing Guide](docs/TESTING.md)
- [Workspace Guide](docs/WORKSPACE.md)
- [Feature Spec](specs/001-zodform/spec.md)
- [Quickstart](specs/001-zodform/quickstart.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE) for details.

---

**Author**: Pradeep Mouli · **Version**: 0.6.0 · **Zod**: v4.x only

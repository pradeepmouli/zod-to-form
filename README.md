<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./attached_assets/banner-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="./attached_assets/banner-light.svg" />
    <img src="./attached_assets/banner-light.svg" alt="zod-to-form banner" />
  </picture>
</p>

<p align="center">
  <strong>Schema in. Form out. It's your code.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@zod-to-form/core"><img src="https://img.shields.io/npm/v/@zod-to-form/core?style=flat-square&label=core" alt="core version" /></a>
  <a href="https://www.npmjs.com/package/@zod-to-form/react"><img src="https://img.shields.io/npm/v/@zod-to-form/react?style=flat-square&label=react" alt="react version" /></a>
  <a href="https://www.npmjs.com/package/@zod-to-form/cli"><img src="https://img.shields.io/npm/v/@zod-to-form/cli?style=flat-square&label=cli" alt="cli version" /></a>
  <img src="https://img.shields.io/badge/zod-v4-blue?style=flat-square" alt="Zod v4" />
</p>

zod-to-form reads a Zod v4 schema and produces a complete React form — either at runtime via `<ZodForm>` or at build time via `z2f generate`. The generated code imports only `react-hook-form`, `zod`, and your components. No zod-to-form imports remain.

---

> **⚠️ Pre-1.0 software** — APIs are subject to change between minor versions. Pin to exact versions in production. See the [CHANGELOG](./CHANGELOG.md) for breaking changes between releases.

## Quick Start

### Runtime — iterate on forms instantly

```bash
pnpm add @zod-to-form/core @zod-to-form/react zod react react-hook-form @hookform/resolvers
```

```tsx
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

<ZodForm schema={schema} onSubmit={(data) => save(data)} />
```

Labels inferred from field names. Select rendered for enums. Validation wired automatically. Full type inference on `onSubmit`.

### Codegen — own the output

```bash
pnpm add -D @zod-to-form/cli zod
npx z2f generate --schema src/schemas/signup.ts --export signupSchema --out src/components/
```

Produces `src/components/SignupForm.tsx` — a hand-readable `.tsx` file that imports only `react-hook-form`, `zod`, and your UI components. Inspect it, modify it, commit it. Use `--watch` to regenerate when the schema changes.

| | Runtime `<ZodForm>` | CLI `z2f generate` |
|---|---|---|
| **Use when** | Iterating, dynamic schemas, prototyping | Production forms, full control |
| **Output** | Rendered from schema at runtime | Static `.tsx` file you own |
| **z2f dependency** | `@zod-to-form/react` at runtime | None — generated code is standalone |
| **Validation** | `zodResolver` or AOT optimization | AOT optimization (L1→L2→L3) |

---

## Key Features

### 1. Build-time codegen with zero-dependency eject

The CLI reads your Zod schema and generates a complete, standalone `.tsx` form component. The output has no runtime dependency on any `@zod-to-form` package — it imports `react`, `react-hook-form`, your components, and `zod` only when refines or transforms are present. Stop using zod-to-form entirely and the generated code keeps working.

The runtime `<ZodForm>` uses the same `@zod-to-form/core` walker and the same `z2f.config.ts`, so component overrides, props, sections, and field ordering carry across. Start with runtime for rapid iteration, eject to codegen for production — nothing changes except who owns the output.

### 2. AOT validation optimization

The walker knows both the schema constraints and which component renders each field. This enables three levels of progressive optimization that work in both runtime and codegen:

**Level 1 — Decompose tree.** Inline all per-field Zod calls as atomic `safeParse` on hoisted schema fragments (created once at module load, not per keystroke). Eliminate `zodResolver`. Object-level refines/transforms collected into a schemaLite and called via `safeParse` on submit.

**Level 2 — Native rules.** Replace inlined Zod calls with native RHF `register()` rules where supported: `min`, `max`, `minLength`, `maxLength`, `pattern` (including extracted email/uuid/url regexes), `required`, `step`. Error messages extracted from the Zod schema at build time. Component-enforced types (enum, boolean, literal) need no validation at all. After L2, Zod calls only remain for fields with `refine()` or `transform()`. If none remain and schemaLite is empty, the `zod` import can be dropped from codegen output.

**Level 3 — Cross-field UX.** Convert analyzable cross-field `superRefine` — both inline on fields and top-level on the schema object — to `watch()` + `validate` for real-time feedback instead of submit-time errors.

### 3. shadcn/ui preset with prop bridging

The `'shadcn'` preset handles controlled components — Select, Checkbox, Switch, RadioGroup — with no custom widgets or renderers. Each component declares its prop mapping once:

```typescript
Select:    { controlled: true, props: { onValueChange: 'field.onChange' } }
Checkbox:  { controlled: true, props: { checked: 'field.value', onCheckedChange: 'field.onChange' } }
```

Values that match a known RHF field expression (`field.onChange`, `field.value`, `field.onBlur`, `field.ref`) are resolved from the React Hook Form controller. Everything else passes through as a literal. One `props` Record for both — no separate `propMap`.

In RJSF you write a custom widget per controlled component. In JSON Forms you write a custom renderer. Here you write two lines of config.

### 4. Zod v4 native introspection

No schema conversion. No intermediate representation invented by the library. zod-to-form reads Zod v4's own internal API:

- `_zod.def` for schema structure (types, shapes, discriminators)
- `_zod.bag` for constraint values (min, max, patterns, formats)
- `z.registry()` for metadata (title, description, examples, deprecated)
- `.meta()` for UI-specific annotations (component overrides, props, hidden, order)

When Zod v4 adds new constraint types, the walker picks them up without code changes.

### 5. Schema-level conditionals via discriminated unions

The walker handles Zod discriminated unions natively. Field visibility and validation are always in sync because both derive from the same schema — not from a parallel rule system that can drift.

```typescript
const schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('personal'), firstName: z.string(), lastName: z.string() }),
  z.object({ type: z.literal('business'), companyName: z.string(), taxId: z.string() }),
]);

// Renders a select for 'type'. Switching to 'business' removes firstName/lastName
// from the form state and validation, adds companyName/taxId. No rule system needed.
```

### 6. Extensible processor + optimizer registries

The walker dispatches each schema node through two registries:

**Processor registry** — maps Zod types to components. One processor per `def.type`. Override or extend for your own components.

**Optimizer registry** — optimizes validation per field. Chained (1:N per type) because L1, L2, L3 are independent transforms. Register custom optimizers for components that enforce constraints the library doesn't know about:

```typescript
const dateRangeOptimizer: FormOptimizer = (schema, ctx, field) => {
  if (field.component === 'DateRangePicker') {
    field.validation = { mode: 'component-enforced' };
    field.zodSchema = undefined;
  }
};

walkSchema(schema, {
  optimization: { level: 2, optimizers: { date: [dateRangeOptimizer] } }
});
```

### 7. Typed recursive FieldConfig

`fields` and `arrayItems` on `FieldConfig` are typed to the Zod schema shape. Your editor autocompletes field names and catches typos at compile time.

```typescript
export default defineConfig({
  schemas: {
    userSchema: {
      fields: {
        name: { component: 'Input', order: 1 },
        addresses: {
          arrayItems: {
            fields: {
              street: { component: 'Input' },
              city: { component: 'Combobox', props: { options: cities } },
            }
          }
        },
        // typo: { ... }  ← TypeScript error: 'typo' does not exist on UserSchema
      }
    }
  }
});
```

### 8. Section grouping without schema restructuring

Group fields from a flat schema into visual sections without changing the schema. Fields sharing the same `section` key are rendered as a group.

```typescript
fields: {
  billingName:     { section: 'billing', order: 1 },
  billingCard:     { section: 'billing', order: 2 },
  shippingAddress: { section: 'shipping', order: 1 },
  shippingCity:    { section: 'shipping', order: 2 },
}
```

RJSF and JSON Forms require restructuring your schema or maintaining a separate layout document to achieve this.

---

## Planned

| Feature | Description |
|---|---|
| **Vite plugin** | `z2f` as a Vite plugin — auto-regenerates forms when schemas change, no CLI step. HMR-aware. |
| **Studio** | Four-quadrant IDE: schema editor, live form preview, config editor, code output. Visual form design with codegen parity. |
| **Standard Schema adapters** | The core walker's processor registry architecture provides the seam to support Standard Schema, Valibot, and ArkType without a rewrite. |
| **zod-aot integration** | `--aot` flag that uses [zod-aot](https://github.com/wakita181009/zod-aot) compiled validators for schemaLite submit-time validation. Flat compiled function instead of `safeParse`. |
| **L3 cross-field analysis** | Static analysis of `superRefine` function bodies to auto-convert to `watch()` + `validate`. Currently blocked on Zod v4 exposing the callback function from baked checks. |

---

## Packages

| Package | Description |
|---|---|
| [`@zod-to-form/core`](packages/core) | Schema walker, processor + optimizer registries, FormField IR — zero runtime deps |
| [`@zod-to-form/react`](packages/react) | `<ZodForm>` runtime renderer + shadcn/ui component map |
| [`@zod-to-form/cli`](packages/cli) | `z2f generate` CLI for static codegen |
| [`@zod-to-form/codegen`](packages/codegen) | Codegen engine — used by CLI and Studio |

## Architecture

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  Zod Schema  │────▶│  @zod-to-form/core    │────▶│  FormField[] │
└─────────────┘     │  walker + registries   │     └──────┬──────┘
                    └──────────────────────┘            │
                           │                            ├──▶ <ZodForm>     (runtime)
                           │                            └──▶ z2f generate  (codegen)
                    ┌──────┴──────┐
                    │  Processors  │  Zod type → component
                    │  Optimizers  │  Validation strategy
                    └─────────────┘
```

The core walker visits each schema node once. Processors map it to a component. Optimizers refine validation. The same `FormField[]` drives both runtime and codegen.

## Supported Zod Types

`string` · `number` · `bigint` · `boolean` · `date` · `enum` · `nativeEnum` · `literal` · `object` · `array` · `tuple` · `record` · `map` · `set` · `union` · `discriminatedUnion` · `intersection` · `optional` · `nullable` · `default` · `readonly` · `lazy` · `pipe` · `transform` · `refine` · `file`

## Development

```bash
pnpm install        # Install dependencies
pnpm test           # Run all tests
pnpm run type-check # TypeScript strict mode
pnpm run build      # Build all packages
```

## Documentation

- Docs site: [https://pradeepmouli.github.io/zod-to-form/](https://pradeepmouli.github.io/zod-to-form/) (also available at https://zod.toform.dev once live)
- [Contributing & Development Workflow](apps/docs/docs/contributing.md)
- [Testing Guide](apps/docs/docs/architecture/testing.md)
- [Runtime Rendering](apps/docs/docs/guides/runtime.md)
- [CLI Codegen](apps/docs/docs/guides/cli.md)
- [Core Config](apps/docs/docs/guides/core-config.md)
- [Component Config](apps/docs/docs/guides/component-config.md)
- [AOT Optimization](apps/docs/docs/guides/optimization.md)
- [Examples](apps/docs/docs/guides/examples.md)
- [Feature Spec](specs/001-zodform/spec.md)
- [Quickstart](specs/001-zodform/quickstart.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE) for details.

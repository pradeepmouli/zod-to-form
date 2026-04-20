---
name: zod-to-form-codegen
description: "Browser-safe code generation for Zod v4 form components Use when working with zod, zod-v4, codegen, forms, form-generation, react-hook-form, schema-driven, template-generation, browser-safe, component-codegen, schema-to-tsx."
license: MIT
---

# @zod-to-form/codegen

Browser-safe code generation for Zod v4 form components

## Features

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

## When to Use

- Working with zod, zod-v4, codegen, forms, form-generation, react-hook-form, schema-driven, template-generation, browser-safe, component-codegen, schema-to-tsx

| Task | Use | Why |
|------|-----|-----|
| Building a custom codegen pipeline that assembles `FormField[]` and needs the TSX string | `generateFormComponent` | — |
| Writing codegen tests that verify output structure without spawning a CLI process | `generateFormComponent` | — |
| Building a custom codegen backend that needs the same override resolution logic as the CLI | `resolveFieldMapping` | — |
| Writing tests that verify field-to-component mapping for a given config | `resolveFieldMapping` | — |

**Avoid when:**

| Don't Use | When | Use Instead |
|-----------|------|-------------|
| `generateFormComponent` | You want file-writing behavior | use `runGenerate()` from `@zod-to-form/cli` instead |
| `generateFormComponent` | You are using the Vite plugin | `compileTarget` wraps this and handles esbuild transformation |
| `resolveFieldMapping` | You are using the CLI or Vite plugin | this is called internally and you don't need it |
- API surface: 8 functions, 1 constants

## Pitfalls

- NEVER call `generateFormComponent` with a stale `fields` array from a previous schema
- version — there is no cache invalidation; callers must re-run `walkSchema` on schema change
- NEVER use the returned string as a module cache key — it is not content-addressed;
- use `configHash` from `@zod-to-form/core` on the config object instead
- NEVER assume `source: 'none'` means the field has no component — the schema walker may
- have inferred one; `resolveFieldMapping` only resolves user-provided config overrides

## Configuration

2 configuration interfaces — see references/config.md for details.

## Quick Reference

**Codegen:** `generateFormComponent` (Generate a React form component as a TypeScript string from `FormField[]`), `resolveFieldMapping` (Resolve the component name and override config for a single `FormField` key)
**Templates:** `getFileHeader` (Generate the import block for a form component file), `renderField` (Render a single `FormField` to its plain-HTML JSX string), `registerPathExpr` (Produce the correct `register(), `generateSchemaLiteFile` (Generate the content of a `), `getFieldTemplateSource` (Return the source code for the preset's `FieldTemplate` React component)
**Config Templates:** `buildConfigSource` (Generate a `z2f)
**field-templates:** `PRESET_TEMPLATE_IMPORTS` (Components that each preset's field template imports from...)

## Links

- [Repository](https://github.com/pradeepmouli/zod-to-form)
- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)
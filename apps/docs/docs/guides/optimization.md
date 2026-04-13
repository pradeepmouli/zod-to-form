---
title: AOT Optimization
sidebar_position: 6
description: Progressive AOT validation optimization (L1/L2/L3), extensible optimizer registries, and typed recursive FieldConfig.
---

# AOT Optimization

The zod-to-form walker knows both the schema constraints and which component renders each field. That joint knowledge enables **ahead-of-time (AOT) validation optimization** — progressive rewrites of per-field validation that work in both the runtime `<ZodForm>` and the `z2f generate` codegen path.

The same three optimization levels apply to both paths: runtime applies them to the `FormField[]` IR at walk time; codegen bakes the optimized output into the emitted `.tsx`.

## Three levels of optimization

### Level 1 — Decompose tree

- Inlines all per-field Zod calls as atomic `safeParse` on **hoisted** schema fragments (created once at module load, not per keystroke).
- Eliminates the `zodResolver` wrapper entirely.
- Object-level `refine`s and `transform`s are collected into a `schemaLite` and called via `safeParse` on submit.

The benefit is twofold: no per-render validator allocation, and a much smaller submit-time schema (only the object-level checks RHF can't express natively).

### Level 2 — Native rules

L2 replaces inlined Zod calls with native React Hook Form `register()` rules wherever the check maps cleanly:

- `min`, `max`, `minLength`, `maxLength`
- `pattern` — including extracted email / uuid / url regexes
- `required`
- `step` (numeric)

Error messages are extracted from the Zod schema **at build time**. Component-enforced types (enum, boolean, literal) need no validation at all — the `<Select>` simply cannot produce an out-of-range value.

After L2, Zod calls only remain for fields that carry `refine()` or `transform()`. If none do and the `schemaLite` is empty, the `zod` import can be dropped from the codegen output entirely.

### Level 3 — Cross-field UX

L3 converts analyzable cross-field `superRefine` — both field-inline and top-level object — to `watch()` + `validate` so the user gets real-time feedback instead of a submit-time error. Static analysis of refine function bodies is currently conservative; unanalyzable refines fall back to schemaLite submit validation.

## How to enable

Pass an `optimization` block to `walkSchema`:

```ts
import { walkSchema } from '@zod-to-form/core';

const fields = walkSchema(schema, {
  optimization: { level: 2 },
});
```

For codegen, the CLI uses the default level from your `z2f.config.ts` — see [Core Config](./core-config.md) for the `optimization` block.

## Custom optimizers

The walker dispatches each field through a chained **optimizer registry**: 1:N optimizers per Zod type. Optimizers run in order, each one free to refine the `FormField`'s validation strategy. Register your own for components that enforce constraints the library doesn't know about — e.g. a `DateRangePicker` that guarantees a valid start/end range on its own.

```ts
import type { FormOptimizer } from '@zod-to-form/core';
import { walkSchema } from '@zod-to-form/core';

const dateRangeOptimizer: FormOptimizer = (schema, ctx, field) => {
  if (field.component === 'DateRangePicker') {
    field.validation = { mode: 'component-enforced' };
    field.zodSchema = undefined;
  }
};

walkSchema(schema, {
  optimization: {
    level: 2,
    optimizers: { date: [dateRangeOptimizer] },
  },
});
```

Setting `mode: 'component-enforced'` and clearing `zodSchema` tells every subsequent stage — L1/L2 rewrites, codegen emission, schemaLite collection — that no validation needs to be emitted for this field. The component is the contract.

## Typed recursive FieldConfig

`fields` and `arrayItems` on `FieldConfig` are typed against your Zod schema shape. Your editor autocompletes field names at every level of nesting, and typos become compile errors — not runtime mysteries.

```ts
import { defineConfig } from '@zod-to-form/core';

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
            },
          },
        },
        // typo: { ... }  ← TypeScript error: 'typo' does not exist on UserSchema
      },
    },
  },
});
```

The nested `arrayItems.fields` shape is derived from `z.array(...)`'s element type, so the same autocomplete works inside repeaters, discriminated unions, and intersected objects.

## When AOT optimization matters

Without optimization, an uncontrolled Zod-backed form runs `safeParse` on the entire schema on every keystroke — allocation plus traversal, multiplied by field count. L1 cuts that to `safeParse` on a hoisted fragment per field. L2 eliminates the `safeParse` entirely for anything RHF can express natively. L3 pushes cross-field feedback from submit-time into the render loop.

For codegen the wins compound: when L2 removes every Zod call for a form and `schemaLite` is empty, the emitted `.tsx` can drop the `zod` import entirely — one less dependency in the generated output.

## Related

- [Core Config](./core-config.md) — the `optimization` block in `z2f.config.ts`
- [Runtime Rendering](./runtime.md) — how `walkSchema` feeds `<ZodForm>`
- [CLI Codegen](./cli.md) — how codegen consumes the optimized IR
- [Examples](./examples.md) — feature-by-feature recipes

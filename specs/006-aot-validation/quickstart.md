# Quickstart: Validation Optimization

**Feature**: 006-aot-validation | **Date**: 2026-03-26

## Enable Optimization

Add the `validation` key to your `z2f.config.ts`:

```typescript
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: { source: '@/components/ui', preset: 'shadcn' },
  defaults: {
    validation: { level: 2 },  // 1 = decompose, 2 = native rules, 3 = cross-field UX
  },
});
```

This setting applies to both runtime (`ZodForm`) and codegen (`zodform generate`).

## What Each Level Does

### Level 1: Decompose Tree

Eliminates `zodResolver`. Each field validates independently via `register({ validate })` with a hoisted Zod schema. Top-level refines/transforms are collected into a `schemaLite` that runs on submit.

### Level 2: Native Rules (recommended)

Replaces simple Zod constraints with native RHF rules. Most fields validate without calling Zod. In codegen, the `zod` import is dropped entirely if no fields need it.

### Level 3: Cross-Field UX

Converts analyzable cross-field `superRefine` patterns to real-time `watch()` + `validate`. Users see cross-field errors as they type instead of waiting for submit.

## Custom Optimizers

Register custom optimizers for components that enforce constraints:

```typescript
import { walkSchema, type FormOptimizer } from '@zod-to-form/core';

const dateRangeOptimizer: FormOptimizer = (schema, ctx, field) => {
  if (field.component === 'DateRangePicker') {
    field.zodSchema = undefined;
    field.validation = { mode: 'component-enforced' };
  }
};

const result = walkSchema(schema, {
  validation: {
    level: 2,
    optimizers: { date: [dateRangeOptimizer] },
  },
});
```

## Verification

After enabling optimization, verify equivalence:

```bash
# Codegen: compare output with and without optimization
zodform generate --schema ./schemas/signup.ts
# Check: no zodResolver import, native RHF rules in register()

# Tests: run equivalence suite
pnpm test -- --grep "equivalence"
```

## Disabling Optimization

Remove the `validation` key from config or set it to `undefined`. The system falls back to `zodResolver` with zero changes to output.

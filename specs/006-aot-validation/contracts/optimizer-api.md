# API Contract: Optimizer Registry

**Feature**: 006-aot-validation | **Date**: 2026-03-26

## Public Types (exported from `@zod-to-form/core`)

### FormOptimizer

```typescript
export type FormOptimizer<T extends $ZodType = $ZodType> = (
  schema: T,
  ctx: FormOptimizerContext,
  field: FormField,
  params: ProcessParams
) => void;
```

Follows the same signature pattern as `FormProcessor`. Mutates `field` in place.

### FormOptimizerContext

```typescript
export interface FormOptimizerContext {
  optimizers: Record<string, FormOptimizer[]>;
  schemaLite: SchemaLiteCollector;
  level: 1 | 2 | 3;
}
```

### ValidationStrategy

```typescript
export interface ValidationStrategy {
  mode: 'zodSchema' | 'native' | 'component-enforced' | 'watch';
  rules?: NativeRules;
  watchFields?: string[];
  watchValidate?: (value: unknown, watchedValues: Record<string, unknown>) => true | string;
}

export interface NativeRules {
  required?: string;
  min?: { value: number; message: string };
  max?: { value: number; message: string };
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
}
```

### WalkOptions Extension

```typescript
export interface WalkOptions {
  // ...existing
  processors?: Record<string, FormProcessor>;
  formRegistry?: ZodFormRegistry;
  maxDepth?: number;

  // New — optimization
  validation?: {
    level?: 1 | 2 | 3;
    optimizers?: Record<string, FormOptimizer[]>;
  };
}
```

### WalkResult

```typescript
export interface WalkResult {
  fields: FormField[];
  schemaLite: $ZodType | null;
}
```

### walkSchema Overloads

```typescript
// Existing signature (no optimization) — returns FormField[]
export function walkSchema(schema: ZodType, options?: WalkOptions & { validation?: undefined }): FormField[];

// Optimized signature — returns WalkResult
export function walkSchema(schema: ZodType, options: WalkOptions & { validation: { level: 1 | 2 | 3 } }): WalkResult;
```

## Config Extension

```typescript
export type ConfigDefaults = {
  // ...existing
  mode?: 'submit' | 'auto-save';
  ui?: 'shadcn' | 'html';
  out?: string;
  overwrite?: boolean;
  serverAction?: boolean;
  formProvider?: boolean;

  // New
  validation?: {
    level?: 1 | 2 | 3;
  };
};
```

## Custom Optimizer Registration

```typescript
import { walkSchema } from '@zod-to-form/core';
import type { FormOptimizer } from '@zod-to-form/core';

const myOptimizer: FormOptimizer = (schema, ctx, field, params) => {
  if (field.component === 'DateRangePicker') {
    field.zodSchema = undefined;
    field.validation = { mode: 'component-enforced' };
  }
};

const result = walkSchema(schema, {
  validation: {
    level: 2,
    optimizers: { date: [myOptimizer] },
  },
});
```

Custom optimizers are merged with builtins: `{ ...builtinOptimizers, ...custom }`. Custom optimizers for a type replace the entire chain for that type (same as custom processors).

## Backward Compatibility

- `walkSchema(schema)` → returns `FormField[]` (unchanged)
- `walkSchema(schema, { processors })` → returns `FormField[]` (unchanged)
- `walkSchema(schema, { validation: { level: 2 } })` → returns `WalkResult`
- `FormField.validation` is optional — all existing code that doesn't read it works unchanged
- `FormField.zodSchema` is optional — same
- Config `validation` key is optional — omitting it preserves zodResolver behavior

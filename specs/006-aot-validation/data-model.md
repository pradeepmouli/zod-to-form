# Data Model: Validation Optimization

**Feature**: 006-aot-validation | **Date**: 2026-03-26

## Entity Definitions

### FormField Extensions

Extends the existing `FormField` interface (`packages/core/src/types.ts`) with two new properties:

#### `zodSchema?: $ZodType`

The atomic Zod schema node for this field, stored by the L1 optimizer. This is the original Zod node from the walk — no new allocation. Used by runtime and codegen to emit per-field `safeParse()` calls.

- **Set by**: L1 optimizer
- **Cleared by**: L2 optimizer when native rules fully replace it
- **Read by**: Runtime `FieldRenderer` (for `register({ validate })`), Codegen emitter (for hoisted `const _field`)

#### `validation?: ValidationStrategy`

```
ValidationStrategy {
  mode: 'zodSchema' | 'native' | 'component-enforced' | 'watch'
  rules?: NativeRules          // Only when mode = 'native'
  watchFields?: string[]       // Only when mode = 'watch'
  watchValidate?: Function     // Only when mode = 'watch'
}
```

**State transitions**:
- Initial (no optimization): `validation` is `undefined` → zodResolver handles everything
- After L1: `{ mode: 'zodSchema' }` for most fields
- After L2: `{ mode: 'native', rules: {...} }` for simple fields; `{ mode: 'component-enforced' }` for enum/boolean/literal; remains `'zodSchema'` for refine/transform fields
- After L3: `{ mode: 'watch', watchFields: [...], watchValidate: fn }` for analyzable cross-field superRefines

### NativeRules

Maps to React Hook Form's `RegisterOptions`:

```
NativeRules {
  required?: string                              // Error message
  min?: { value: number, message: string }
  max?: { value: number, message: string }
  minLength?: { value: number, message: string }
  maxLength?: { value: number, message: string }
  pattern?: { value: RegExp, message: string }
}
```

Each field contains the constraint value AND the error message extracted from the Zod schema's bag.

### FormOptimizer

```
FormOptimizer = (
  schema: $ZodType,
  ctx: FormOptimizerContext,
  field: FormField,
  params: ProcessParams
) => void
```

Mirrors the `FormProcessor` signature. Mutates `field` in place (same pattern as processors).

### FormOptimizerContext

```
FormOptimizerContext {
  optimizers: Record<string, FormOptimizer[]>   // def.type → optimizer chain
  schemaLite: SchemaLiteCollector               // Accumulates un-inlineable validations
  level: 1 | 2 | 3                             // Current optimization depth
}
```

### SchemaLiteCollector

```
SchemaLiteCollector {
  topLevel: Array<{ type, fn }>    // Refines/transforms from original schema
  fields: Map<string, $ZodType>    // Fallthrough fields that couldn't be inlined

  addTopLevel(type, fn)            // Called by walker pre-pass
  addField(path, schema)           // Called by optimizer safety net
  isEmpty(): boolean               // True when nothing collected
  build(): $ZodType | null         // Constructs z.object({}).loose().superRefine(...) or null
}
```

**Lifecycle**: Created before walk → fed during walk → evaluated after walk → either emitted or discarded.

### WalkResult

Returned by `walkSchema` when optimization is enabled:

```
WalkResult {
  fields: FormField[]              // Same as current return type
  schemaLite: $ZodType | null      // null when SchemaLiteCollector is empty
}
```

## Entity Relationships

```
walkSchema()
  ├── creates SchemaLiteCollector
  ├── creates FormOptimizerContext
  ├── for each field:
  │     ├── processor(schema, ctx, field, params)     [existing]
  │     └── optimizer chain(schema, optCtx, field, params)  [new]
  │           ├── L1: sets field.zodSchema, field.validation.mode
  │           ├── L2: converts to field.validation.rules or component-enforced
  │           └── L3: converts to field.validation.watchFields + watchValidate
  └── returns WalkResult { fields, schemaLite: collector.build() }

Runtime consumption:
  useZodForm()
    ├── optimization off → zodResolver(schema)
    └── optimization on  → walkSchema(schema, { validation }) → WalkResult
          ├── fields → FieldRenderer reads field.validation
          └── schemaLite → SchemaLiteSubmit wraps onSubmit

Codegen consumption:
  generateFormComponent(fields, config)
    ├── fields with validation.mode = 'zodSchema' → hoisted const + register({ validate })
    ├── fields with validation.mode = 'native' → register({ ...rules })
    ├── fields with validation.mode = 'component-enforced' → no validation emitted
    ├── fields with validation.mode = 'watch' → watch() + validate
    └── schemaLite non-null → hoisted schemaLite + onSubmit handler
```

## Configuration Extension

Added to `ZodFormsConfig.defaults`:

```
defaults: {
  validation?: {
    level?: 1 | 2 | 3     // Optimization depth (undefined = disabled, use zodResolver)
  }
}
```

Single global setting in `z2f.config.ts`, read by both runtime and codegen.

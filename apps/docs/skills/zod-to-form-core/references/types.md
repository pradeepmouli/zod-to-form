# Types & Enums

## Types

### `FormField`
Intermediate representation of a single form field produced by `walkSchema`.
Each processor fills in component, props, constraints, and optional children.
This structure is consumed by codegen (static TSX generation) and by the
runtime `FieldRenderer` to produce a live React component tree.
**Properties:**
- `key: string` — Field path, e.g. "name", "address.street", "items.0.name"
- `component: string` — Component name from ComponentMap, e.g. "Input", "Select", "Textarea"
- `props: Record<string, unknown>` — Pass-through props for the component
- `label: string` — Display label
- `description: string` (optional) — Help text from .describe() or .meta()
- `placeholder: string` (optional) — Placeholder from examples[0] or metadata
- `required: boolean` — Whether the field is required
- `defaultValue: unknown` (optional) — Default value from z.default() or metadata
- `readOnly: boolean` — Read-only from z.readonly() or metadata
- `hidden: boolean` — Hidden but present in form state
- `order: number` (optional) — Display order override from form registry
- `disabled: boolean` — Non-interactive state (greyed out)
- `helpText: string` (optional) — Help text rendered below the input, distinct from description (below label)
- `deprecated: boolean` — Whether the field is marked as deprecated in the schema registry
- `options: FormFieldOption[]` (optional) — Options for enum/union select fields
- `children: FormField[]` (optional) — Children for nested objects
- `arrayItem: FormField` (optional) — Template for array items
- `constraints: FormFieldConstraints` — Validation constraints extracted from Zod v4 constraint bag (_zod.bag)
- `zodType: string` — Original Zod def.type for reference
- `hasCustomRender: boolean` (optional) — Whether a custom render function is registered for this field (runtime only)
- `render: (field: FormField, props: Record<string, unknown>) => unknown` (optional) — Custom render function from FormMeta (runtime only, not serialisable)
- `zodSchema: $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>` (optional) — Atomic Zod schema for this field, set by L1 optimizer
- `validation: ValidationStrategy` (optional) — Validation strategy set by optimizers (undefined = use zodResolver)

### `FormFieldOption`
An individual option in a Select, RadioGroup, or similar enum-driven component.
Generated from z.enum(), z.literal(), and z.union() of literals by their processors.
**Properties:**
- `value: string | number` — The option value submitted with the form (must be string or number for HTML compatibility).
- `label: string` — Human-readable label displayed in the Select, RadioGroup, or Combobox.
- `disabled: boolean` (optional) — When true, the option is shown but cannot be selected.

### `FormFieldConstraints`
Structural constraints extracted from Zod's `_zod.bag` for a field.
Used to populate HTML validation attributes (min, max, minLength, pattern, etc.)
and to drive the L2 native-rules optimizer output.
**Properties:**
- `min: number` (optional) — Minimum numeric value (from `z.number().min()`).
- `max: number` (optional) — Maximum numeric value (from `z.number().max()`).
- `minLength: number` (optional) — Minimum string length (from `z.string().min()`).
- `maxLength: number` (optional) — Maximum string length (from `z.string().max()`).
- `pattern: string` (optional) — Regex pattern as a string (from `z.string().regex()`).
- `format: string` (optional) — String format name (from `z.string().email()` → `'email'`, etc.).
- `step: number` (optional) — Step constraint for numeric inputs (1 for integer-constrained fields).

### `FormProcessor`
A processor function that mutates a `FormField` in-place based on the Zod schema it handles.
Dispatched by the walker based on `schema._zod.def.type`. Register custom processors
via `walkSchema(schema, { processors: { myType: myProcessor } })`.
```ts
(schema: T, ctx: FormProcessorContext, field: FormField, params: ProcessParams) => void
```

### `FormProcessorContext`
Runtime context passed to every processor during a walkSchema traversal.
Provides the processor registry, form registry, path tracking, cycle detection,
and a child-processing callback for recursive types (object, array, union).
**Properties:**
- `processors: Record<string, FormProcessor>` — Registry mapping def.type → processor function
- `formRegistry: ZodFormRegistry` (optional) — Form-specific metadata registry
- `path: string[]` — Current field path stack
- `seen: WeakSet<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>` — Tracks visited schema objects — prevents infinite loops from recursive schemas and avoids re-processing the same reference
- `maxDepth: number` — Maximum recursion depth (default: 5)
- `currentDepth: number` — Current recursion depth
- `processChild: (schema: $ZodType, key: string) => FormField` (optional) — Process a child schema into a FormField.
Provided by the walker for use in nesting processors (object, array, union).
Undefined only in unit-test contexts where nesting is not being tested.

### `FormMeta`
Per-schema annotation stored in a `z.registry<FormMeta>()`.
Extends `FieldConfig` with a runtime-only `render` function for custom field rendering.
Used with `registerDeep()` / `registerFlat()` to attach form metadata to Zod schemas.
```ts
FieldConfig<T> & { render?: (field: FormField, props: unknown) => unknown }
```

### `GhostRow`
A renderable row that lives inside an array section without participating
in form state. Used for inherited rows, computed defaults, or read-only
informational entries.
**Properties:**
- `id: string` — Stable identifier within a `before` or `after` group. The renderer
combines this with the group name to form the React key
(`ghost-before-${id}` / `ghost-after-${id}`), so the same `id` may
safely appear in both groups without collision. Duplicates *within*
a single group emit a one-time development warning. Required so
that reorders of real rows don't remount ghost rows.
- `render: (ctx: GhostRowContext) => unknown` — Render function. Receives positional context relative to other ghost rows.

### `GhostRowContext`
Positional context passed to a `GhostRow`'s render function.
**Properties:**
- `isFirst: boolean` — True if this row is the first ghost row in its `before` or `after` group.
- `isLast: boolean` — True if this row is the last ghost row in its `before` or `after` group.

### `ProcessParams`
Optional parameters passed to each processor alongside the schema, context, and field.
Provides parent key and array-item metadata needed for path construction.
**Properties:**
- `parentKey: string` (optional) — Parent field path for nested fields
- `isArrayItem: boolean` (optional) — Whether this field is an array item template
- `index: number` (optional) — Array item index for rendering

### `NativeRules`
Native HTML and RHF validation rules extracted from Zod constraints.
Used by L2 optimizers to produce per-field validation rules that map directly
to react-hook-form's `register()` options, bypassing the zodResolver overhead.
**Properties:**
- `required: string` (optional) — Required validation message shown when field is empty.
- `min: { value: number; message: string }` (optional) — Minimum numeric value constraint with violation message.
- `max: { value: number; message: string }` (optional) — Maximum numeric value constraint with violation message.
- `minLength: { value: number; message: string }` (optional) — Minimum string length constraint with violation message.
- `maxLength: { value: number; message: string }` (optional) — Maximum string length constraint with violation message.
- `pattern: { value: RegExp; message: string }` (optional) — Regex pattern constraint with violation message.

### `ValidationStrategy`
Specifies how a field's validation is handled at submit and change time.
Set by the L1/L2 optimizers; undefined means use the whole-schema zodResolver.
**Properties:**
- `mode: "zodSchema" | "native" | "component-enforced"` — How validation is performed for this field:
- `'zodSchema'` — per-field Zod schema via `register({ validate })` (L1)
- `'native'` — HTML/RHF native rules from the constraint bag (L2)
- `'component-enforced'` — the component handles validation itself (no RHF rules emitted)
- `rules: NativeRules` (optional) — Native RHF validation rules, populated by the L2 optimizer when `mode === 'native'`.

## types

### `FieldExpression`
Known RHF field expression strings that can be used as values in `props`.
When a prop value matches one of these strings, it is resolved from the
RHF controller field at render time instead of being passed as a literal.
```ts
"field.value" | "field.onChange" | "field.onBlur" | "field.ref" | "field.name"
```

### `ZodFormRegistry`
Zod v4 registry parameterized with FormMeta. Create via `z.registry<FormMeta>()`.
```ts
$ZodRegistry<FormMeta>
```

## config

### `ComponentOverride`
Per-component metadata override. Only components that differ from defaults need an entry.

### `StripIndexSignature`
Strips index signatures from a type, keeping only explicitly declared keys.
Useful for Zod's `z.output<>` which adds `[x: string]: unknown` index signatures.
```ts
T extends readonly (infer U)[] ? StripIndexSignature<U>[] : T extends object ? { [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: StripIndexSignature<T[K]> } : T
```

## Configuration

### `ComponentPreset`
Preset name for built-in component library mappings.
`'shadcn'` uses Radix-based controlled components with field-expression props;
`'html'` uses plain uncontrolled HTML inputs.
```ts
"shadcn" | "html"
```

### `ConfigDefaults`
Default generation settings applied to all schemas unless overridden per-schema.
These map directly to CLI flag defaults and to the `defaults` block in `z2f.config.ts`.

## Optimization

### `FormOptimizer`
An optimizer function that mutates a `FormField` after the processor has run.
Receives the same schema, context, field, and params as a processor.
Used to attach validation metadata (`field.validation`, `field.zodSchema`) and
to register lite-schema fragments for submit-time validation.
```ts
(schema: T, ctx: FormOptimizerContext, field: FormField, params: ProcessParams) => void
```

### `FormOptimizerContext`
Context shared across all optimizers during a `walkSchema` run.
Carries the optimizer registry, the SchemaLite collector, the optimization level,
and the current collector's base path for building nested lite schemas.
**Properties:**
- `optimizers: Record<string, FormOptimizer[]>` — The registered optimizer chains, keyed by Zod def.type
- `schemaLite: SchemaLiteCollector` — Mutable collector that accumulates checks and fallthrough fields for the lite schema
- `level: 1 | 2 | 3` — Optimization level: 1 = decompose per-field, 2 = native rules, 3 = cross-field
- `collectorBasePath: string` — Dot-path prefix of the current collector's scope (empty string at root)

### `SchemaLiteCollector`
Mutable accumulator that builds a lite Zod schema for submit-time validation.
Collects checks (from `superRefine`/`refine`), transforms (from `pipe`/`transform`),
and fallthrough field schemas (for fields that cannot be inlined).
Call `build()` at the end of a walker traversal to get the final lite schema.
**Properties:**
- `checks: readonly unknown[]` — Read-only access to collected checks
- `fields: ReadonlyMap<string, $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>` — Read-only access to collected fallthrough fields

## Schema Walking

### `WalkResult`
The result returned by `walkSchema()` when an optimization level is specified.
Contains the full `FormField[]` tree plus a lite Zod schema for submit-time validation
and metadata that codegen uses to reconstruct the lite schema in generated files.
**Properties:**
- `fields: FormField[]` — Ordered, sorted FormField tree produced by the schema walker
- `schemaLite: $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>> | null` — Lite schema for submit-time validation (null when no effects were found)
- `schemaLiteInfo: SchemaLiteInfo` — Codegen metadata — describes how to reconstruct schemaLite in generated code

## optimizers

### `SchemaLiteInfo`
Metadata for codegen to reconstruct the lite schema in a generated file
```ts
SchemaLiteInfoBase & { type: "checks"; checkCount: number } | SchemaLiteInfoBase & { type: "transform"; hasInnerChecks: boolean; hasOuterChecks: boolean } | SchemaLiteInfoBase & { type: "original" } | null
```

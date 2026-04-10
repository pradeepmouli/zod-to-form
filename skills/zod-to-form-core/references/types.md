# Types & Enums

## types

### `FormField`
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
**Properties:**
- `value: string | number`
- `label: string`
- `disabled: boolean` (optional)

### `FormFieldConstraints`
**Properties:**
- `min: number` (optional)
- `max: number` (optional)
- `minLength: number` (optional)
- `maxLength: number` (optional)
- `pattern: string` (optional)
- `format: string` (optional)
- `step: number` (optional)

### `FormProcessor`
```ts
(schema: T, ctx: FormProcessorContext, field: FormField, params: ProcessParams) => void
```

### `FormProcessorContext`
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
```ts
FieldConfig<T> & { render?: (field: FormField, props: unknown) => unknown }
```

### `FieldConfig`
Per-field configuration that customises how a Zod schema field is rendered.

Merges base options (component override, visibility, order, props) with type-aware
extras: nested `fields` for object schemas, and `arrayItems` for array schemas.
Use this type when annotating a `ZodFormsConfig.fields` record or a per-schema
`schemas.[key].fields` map.
```ts
FieldConfigBase & FieldConfigExtras<T>
```

### `FieldExpression`
Known RHF field expression strings that can be used as values in `props`.
When a prop value matches one of these strings, it is resolved from the
RHF controller field at render time instead of being passed as a literal.
```ts
"field.value" | "field.onChange" | "field.onBlur" | "field.ref" | "field.name"
```

### `ProcessParams`
**Properties:**
- `parentKey: string` (optional) — Parent field path for nested fields
- `isArrayItem: boolean` (optional) — Whether this field is an array item template
- `index: number` (optional) — Array item index for rendering

### `WalkOptions`
**Properties:**
- `formRegistry: ZodFormRegistry` (optional) — Custom form registry for metadata annotations
- `processors: Record<string, FormProcessor<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>>` (optional) — Custom processors to add or override built-in ones
- `maxDepth: number` (optional) — Maximum recursion depth for lazy/recursive schemas (default: 5)
- `optimization: { level: 1 | 2 | 3; optimizers?: Record<string, FormOptimizer[]> }` (optional) — Validation optimization settings.

This is the walker's API surface — callers (useZodForm, CLI codegen) pass
the optimization config here. The CLI reads `config.defaults.optimization`
and forwards it; useZodForm accepts it via its own options. Both converge
here as the single source of truth for the walker.

### `ZodFormRegistry`
Zod v4 registry parameterized with FormMeta. Create via `z.registry<FormMeta>()`.
```ts
$ZodRegistry<FormMeta>
```

### `NativeRules`
**Properties:**
- `required: string` (optional)
- `min: { value: number; message: string }` (optional)
- `max: { value: number; message: string }` (optional)
- `minLength: { value: number; message: string }` (optional)
- `maxLength: { value: number; message: string }` (optional)
- `pattern: { value: RegExp; message: string }` (optional)

### `ValidationStrategy`
**Properties:**
- `mode: "zodSchema" | "native" | "component-enforced"`
- `rules: NativeRules` (optional)

### `FormOptimizer`
```ts
(schema: T, ctx: FormOptimizerContext, field: FormField, params: ProcessParams) => void
```

### `FormOptimizerContext`
**Properties:**
- `optimizers: Record<string, FormOptimizer[]>`
- `schemaLite: SchemaLiteCollector`
- `level: 1 | 2 | 3`
- `collectorBasePath: string` — Dot-path prefix of the current collector's scope (empty string at root)

### `WalkResult`
**Properties:**
- `fields: FormField[]`
- `schemaLite: $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>> | null`
- `schemaLiteInfo: SchemaLiteInfo` — Codegen metadata — describes how to reconstruct schemaLite in generated code

### `SchemaLiteCollector`
**Properties:**
- `checks: readonly unknown[]` — Read-only access to collected checks
- `fields: ReadonlyMap<string, $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>` — Read-only access to collected fallthrough fields

### `SchemaLiteInfo`
Metadata for codegen to reconstruct the lite schema in a generated file
```ts
SchemaLiteInfoBase & { type: "checks"; checkCount: number } | SchemaLiteInfoBase & { type: "transform"; hasInnerChecks: boolean; hasOuterChecks: boolean } | SchemaLiteInfoBase & { type: "original" } | null
```

## config

### `ComponentOverride`
Per-component metadata override. Only components that differ from defaults need an entry.

### `ComponentPreset`
```ts
"shadcn" | "html"
```

### `ComponentsConfig`

### `TypedFieldConfig`
Discriminated union over component keys.
When `component` is set to a known component key, `props` is constrained
to that component's prop type. When `component` is omitted, `props` is
an open `Record<string, unknown>`.
```ts
{ [K in keyof TComponents & string]: TypedFieldConfigForComponent<TComponents, K> }[keyof TComponents & string] | UntypedFieldConfig
```

### `ZodFormsConfig`
Root configuration type for `zod-to-form` code generation.

Describes the component library to use, generation defaults, per-schema
overrides, and global field configuration. Pass this to `defineConfig()` in
your `z2f.config.ts` for full type inference, or load and validate it at
runtime with `validateConfig()`.

### `ZodTypeConfig`

### `ConfigDefaults`

### `OptimizationConfig`

### `StripIndexSignature`
Strips index signatures from a type, keeping only explicitly declared keys.
Useful for Zod's `z.output<>` which adds `[x: string]: unknown` index signatures.
```ts
T extends readonly (infer U)[] ? StripIndexSignature<U>[] : T extends object ? { [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: StripIndexSignature<T[K]> } : T
```

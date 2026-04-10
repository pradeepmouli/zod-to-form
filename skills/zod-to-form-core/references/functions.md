# Functions

## `createOptimizers`
Create an optimizer registry by merging custom optimizers with builtins.
Custom optimizers for a type replace the entire chain for that type.
```ts
createOptimizers(custom: Record<string, FormOptimizer[]>): Record<string, FormOptimizer[]>
```
**Parameters:**
- `custom: Record<string, FormOptimizer[]>` — default: `{}`
**Returns:** `Record<string, FormOptimizer[]>`

## schema-lite

### `createSchemaLiteCollector`
Create a new SchemaLiteCollector instance.

Builds a "lite" schema for submit-time validation:
- Checks (superRefine/refine): z.object({}).loose().check(c1).check(c2)
- Transforms: z.object({}).loose().check(...).transform(fn)
- Non-decomposable pipes: original schema as-is
```ts
createSchemaLiteCollector(options?: { useAnyBase?: boolean }): SchemaLiteCollector
```
**Parameters:**
- `options: { useAnyBase?: boolean }` (optional)
**Returns:** `SchemaLiteCollector`

## config

### `defineConfig`
Identity helper that returns its argument typed as `ZodFormsConfig`.

Merges preset component overrides (e.g. shadcn) into `config.components.overrides`
so that user-supplied overrides layer on top of the preset defaults. Use this in
your `z2f.config.ts` to get full TypeScript inference and IDE autocompletion.
```ts
defineConfig<TComponents, TSchemas>(config: ZodFormsConfig<TComponents, TSchemas>): ZodFormsConfig<TComponents, TSchemas>
```
**Parameters:**
- `config: ZodFormsConfig<TComponents, TSchemas>` — The raw configuration object.
**Returns:** `ZodFormsConfig<TComponents, TSchemas>` — The same configuration with preset overrides applied.
```ts
export default defineConfig({
  components: { source: '@/components/ui', preset: 'shadcn' },
});
```

### `validateConfig`
Validates an unknown value as a `ZodFormsConfig` at runtime.

Parses `value` using the internal Zod config schema and throws a descriptive
error if validation fails. Use this when loading config from untrusted sources
such as JSON files or dynamic `import()` calls.
```ts
validateConfig(value: unknown, source: string): ZodFormsConfig<Record<string, unknown>>
```
**Parameters:**
- `value: unknown` — The value to validate.
- `source: string` — default: `'config'` — Human-readable label for error messages (defaults to `'config'`).
**Returns:** `ZodFormsConfig<Record<string, unknown>>` — The validated configuration cast to `ZodFormsConfig`.
**Throws:** If `value` does not conform to the config schema.

### `resolveFieldConfig`
```ts
resolveFieldConfig(globalFields: Record<string, FieldConfig> | undefined, schemaFields: Partial<Record<string, FieldConfig>> | undefined): Record<string, FieldConfig>
```
**Parameters:**
- `globalFields: Record<string, FieldConfig> | undefined`
- `schemaFields: Partial<Record<string, FieldConfig>> | undefined`
**Returns:** `Record<string, FieldConfig>`

### `normalizeConfig`
```ts
normalizeConfig(config: ZodFormsConfig<Record<string, unknown>>): ZodFormsConfig<Record<string, unknown>>
```
**Parameters:**
- `config: ZodFormsConfig<Record<string, unknown>>`
**Returns:** `ZodFormsConfig<Record<string, unknown>>`

## utils

### `inferLabel`
Convert a camelCase or snake_case key to a human-readable Title Case label.
```ts
inferLabel(key: string): string
```
**Parameters:**
- `key: string`
**Returns:** `string`
```ts
inferLabel('firstName') → 'First Name'
```
```ts
inferLabel('email_address') → 'Email Address'
```

### `joinPath`
```ts
joinPath(parent: string | undefined, key: string): string
```
**Parameters:**
- `parent: string | undefined`
- `key: string`
**Returns:** `string`

### `createBaseField`
Create a base FormField with sensible defaults.
Processors fill in the specific component and props.
```ts
createBaseField(key: string, zodType: string): FormField
```
**Parameters:**
- `key: string`
- `zodType: string`
**Returns:** `FormField`

### `getEmptyDefault`
Returns a type-safe empty default value for a FormField based on its zodType
and structure. Used by codegen for useFieldArray append() defaults and
by runtime for initial values.

- string → ''
- number/bigint → 0
- boolean → false
- date → undefined
- object (Fieldset) → recursively builds from children
- array (ArrayField) → []
- enum → first option value or ''
- union/discriminatedUnion → first variant's empty default
```ts
getEmptyDefault(field: FormField): unknown
```
**Parameters:**
- `field: FormField`
**Returns:** `unknown`

### `normalizeFieldKey`
Normalise a concrete field key to the bracket notation used in config.
Replaces `.0.`, `.${index}.`, and any `.<digits>.` segments with `[].`.
```ts
normalizeFieldKey(key: string): string
```
**Parameters:**
- `key: string`
**Returns:** `string`
```ts
normalizeFieldKey('items.0.name') → 'items[].name'
```
```ts
normalizeFieldKey('items.${index}.name') → 'items[].name'
```
```ts
normalizeFieldKey('tags.2') → 'tags[]'
```

### `collectFieldSections`
Collect section groupings from fields and a config override lookup.
Returns a Map of section name → array of field keys that belong to it.
```ts
collectFieldSections(fields: FormField[], getOverride: (key: string) => { section?: string } | undefined): Map<string, string[]>
```
**Parameters:**
- `fields: FormField[]`
- `getOverride: (key: string) => { section?: string } | undefined`
**Returns:** `Map<string, string[]>`

## normalize

### `normalizeFormValues`
Normalize raw HTML form values for Zod parsing.

HTML inputs produce values that don't match Zod's expectations:
- Empty strings "" for unset optional fields (Zod .optional() accepts undefined, not "")
- FileList objects for file inputs (Zod expects File or undefined)

This function recursively normalizes these mismatches so that
schema.safeParse(normalizeFormValues(values)) works correctly.

Called unconditionally in the resolver wrapper to ensure consistent
behavior across all component libraries. While shadcn components handle
most value conversions natively, normalization provides a safety net for
edge cases like FileList objects.
```ts
normalizeFormValues(value: unknown): unknown
```
**Parameters:**
- `value: unknown`
**Returns:** `unknown`

## walker

### `walkSchema`
Walk a Zod schema and produce a FormField[] tree.
When optimization option is set, returns WalkResult with fields + schemaLite.
```ts
walkSchema(schema: $ZodType, options: WalkOptions & { optimization: { level: 1 | 2 | 3 } }): WalkResult
```
**Parameters:**
- `schema: $ZodType`
- `options: WalkOptions & { optimization: { level: 1 | 2 | 3 } }`
**Returns:** `WalkResult`
**Overloads:**
```ts
walkSchema(schema: $ZodType, options?: WalkOptions): FormField[]
```

## registry

### `createProcessors`
Create a custom processor registry by merging with built-in processors.
```ts
createProcessors(custom: Record<string, FormProcessor>): Record<string, FormProcessor>
```
**Parameters:**
- `custom: Record<string, FormProcessor>`
**Returns:** `Record<string, FormProcessor>`

## register

### `registerDeep`
Register a schema and all its nested fields in a registry using a
path-structured FieldConfig tree.

Only the flat metadata fields (`fieldType`, `order`, `hidden`, `section`,
`props`, etc.) are passed to `registry.add()` for each schema. The
structural keys `fields` and `arrayItems` are used purely to drive the
recursive walk and are never stored in the registry.
```ts
registerDeep<S, Meta>(registry: $ZodRegistry<Meta>, schema: S, config: FieldConfig<S>): void
```
**Parameters:**
- `registry: $ZodRegistry<Meta>`
- `schema: S`
- `config: FieldConfig<S>`
```ts
const formRegistry = z.registry<FormMeta>();

const schema = z.object({
  name: z.string(),
  address: z.object({ street: z.string(), city: z.string() }),
  tags: z.array(z.string()),
});

registerDeep(formRegistry, schema, {
  component: 'form',
  fields: {
    name:    { component: 'Input', order: 0 },
    address: {
      component: 'Fieldset',
      fields: {
        street: { component: 'Input' },
        city:   { component: 'Input', hidden: true },
      },
    },
    tags: {
      component: 'ArrayField',
      arrayItems: { component: 'Input' },
    },
  },
});
```

### `registerFlat`
Register flat dot-path field configs against a schema's registry.

Typically called with the merged output of `resolveFieldConfig()`,
a flat `Record<string, FieldConfig>` keyed by dot-paths like
`"name"`, `"address.street"`, `"tags[]"` — and resolves each path against
the schema structure, calling `registry.add()` for the target schema node.

This bridges the existing flat config format (used by CLI and
`ZodFormsConfig.fields`) into the registry so that `walkSchema` can
consume it uniformly.
```ts
registerFlat<Meta>(registry: $ZodRegistry<Meta>, schema: $ZodType, fields: Record<string, FieldConfig>): void
```
**Parameters:**
- `registry: $ZodRegistry<Meta>`
- `schema: $ZodType`
- `fields: Record<string, FieldConfig>`
```ts
const formRegistry = z.registry<FormMeta>();
const schema = z.object({
  name: z.string(),
  address: z.object({ street: z.string(), city: z.string() }),
});

registerFlat(formRegistry, schema, {
  name:             { component: 'Input', order: 0 },
  'address.street': { component: 'Input' },
  'address.city':   { component: 'Input', hidden: true },
});
```

## array

### `processArray`
```ts
processArray(schema: $ZodArray, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodArray`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

### `processTuple`
```ts
processTuple(schema: $ZodTuple, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodTuple`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

## boolean

### `processBoolean`
```ts
processBoolean(schema: $ZodBoolean, ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodBoolean`
- `ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

## collections

### `processMap`
Process z.map() — renders as an array-like repeater of key-value pair fieldsets.
Each entry has a `key` field and a `value` field derived from the Map's type params.
```ts
processMap(schema: $ZodMap, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodMap`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

### `processSet`
Process z.set() — renders as an array-like repeater of unique items.
The value type determines the item template.
```ts
processSet(schema: $ZodSet, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodSet`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

## cross-ref

### `processCrossRef`
```ts
processCrossRef(schema: $ZodType, ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodType`
- `ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

## date

### `processDate`
```ts
processDate(_schema: $ZodDate<unknown> | $ZodISODate, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `_schema: $ZodDate<unknown> | $ZodISODate`
- `_ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

## enum

### `processEnum`
```ts
processEnum(schema: $ZodEnum, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodEnum`
- `_ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

### `processLiteral`
```ts
processLiteral(schema: $ZodLiteral, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodLiteral`
- `_ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

## fallback

### `processFallback`
```ts
processFallback(schema: $ZodType, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodType`
- `_ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

## file

### `processFile`
```ts
processFile(_schema: $ZodType, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `_schema: $ZodType`
- `_ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

## number

### `processNumber`
```ts
processNumber(schema: $ZodNumber<unknown> | $ZodBigInt<unknown>, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodNumber<unknown> | $ZodBigInt<unknown>`
- `_ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

## object

### `processObject`
```ts
processObject(schema: $ZodObject, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodObject`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

### `processIntersection`
```ts
processIntersection(schema: $ZodIntersection, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodIntersection`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

## record

### `processRecord`
```ts
processRecord(schema: $ZodRecord, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodRecord`
- `_ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

## string

### `processString`
```ts
processString(schema: $ZodString, ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodString`
- `ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

### `processTemplateLiteral`
```ts
processTemplateLiteral(schema: $ZodTemplateLiteral, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodTemplateLiteral`
- `_ctx: FormProcessorContext`
- `field: FormField`
- `_params: ProcessParams`

## union

### `processUnion`
```ts
processUnion(schema: $ZodUnion, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodUnion`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

### `processDiscriminatedUnion`
```ts
processDiscriminatedUnion(schema: $ZodDiscriminatedUnion, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodDiscriminatedUnion`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

## wrappers

### `processDefault`
```ts
processDefault(schema: $ZodDefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>> | $ZodPrefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodDefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>> | $ZodPrefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

### `processLazy`
```ts
processLazy(schema: $ZodLazy, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodLazy`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

### `processNullable`
```ts
processNullable(schema: $ZodNullable, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodNullable`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`

### `processOptional`
```ts
processOptional(schema: $ZodOptional, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodOptional`
- `ctx: FormProcessorContext`
- `field: FormField`
- `params: ProcessParams`


<!-- truncated -->

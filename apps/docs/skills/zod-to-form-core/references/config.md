# Configuration

## ArrayConfig

Configuration for array field add/remove buttons.
Applied via FormMeta registry on `z.array()` schemas.

### Properties

#### addLabel

Label for the "add item" button (default: "+ Add")

**Type:** `string`

#### removeLabel

Label for the "remove item" button (default: "− Remove")

**Type:** `string`

## FieldConfig

Per-field configuration that customises how a Zod schema field is rendered.

Merges base options (component override, visibility, order, props) with type-aware
extras: nested `fields` for object schemas, and `arrayItems` for array schemas.
Use this type when annotating a `ZodFormsConfig.fields` record or a per-schema
`schemas.[key].fields` map.

## WalkOptions

### Properties

#### formRegistry

Custom form registry for metadata annotations

**Type:** `ZodFormRegistry`

#### processors

Custom processors to add or override built-in ones

**Type:** `Record<string, FormProcessor<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>>`

#### maxDepth

Maximum recursion depth for lazy/recursive schemas (default: 5)

**Type:** `number`

#### optimization

Validation optimization settings.

This is the walker's API surface — callers (useZodForm, CLI codegen) pass
the optimization config here. The CLI reads `config.defaults.optimization`
and forwards it; useZodForm accepts it via its own options. Both converge
here as the single source of truth for the walker.

**Type:** `{ level: 1 | 2 | 3; optimizers?: Record<string, FormOptimizer[]> }`

## ComponentsConfig

### Properties

#### source

Import path for the components module

**Type:** `string`

**Required:** yes

#### preset

Preset that provides base overrides and default field template

**Type:** `ComponentPreset`

#### fieldTemplate

Custom field template component path.
Controls the composition of label + input + description + helpText + error.
Overrides the preset's default template.

**Type:** `string`

#### overrides

Per-component overrides, strongly typed to module export keys

**Type:** `{ [K in keyof T & string]?: ComponentOverride }`

## TypedFieldConfig

Discriminated union over component keys.
When `component` is set to a known component key, `props` is constrained
to that component's prop type. When `component` is omitted, `props` is
an open `Record<string, unknown>`.

## ZodFormsConfig

Root configuration type for `zod-to-form` code generation.

Describes the component library to use, generation defaults, per-schema
overrides, and global field configuration. Pass this to `defineConfig()` in
your `z2f.config.ts` for full type inference, or load and validate it at
runtime with `validateConfig()`.

### Properties

#### components



**Type:** `ComponentsConfig<TComponents>`

**Required:** yes

#### defaults



**Type:** `ConfigDefaults`

#### types



**Type:** `string[]`

#### include



**Type:** `string[]`

#### exclude



**Type:** `string[]`

#### fields



**Type:** `Record<string, TypedFieldConfig<TComponents>>`

#### schemas



**Type:** `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`

## ZodTypeConfig

### Properties

#### name



**Type:** `string`

#### mode



**Type:** `"submit" | "auto-save"`

#### out



**Type:** `string`

#### serverAction



**Type:** `boolean`

#### fields



**Type:** `Partial<Record<TFieldKeys, TypedFieldConfig<TComponents>>>`

## OptimizationConfig

### Properties

#### level



**Type:** `1 | 2 | 3`

## CodegenConfig

### Properties

#### schemaImportPath

Optional pre-computed import path for the schema (e.g., `./schema.js`).
Defaults to `./schema`. The CLI typically computes this from file paths;
the browser playground and Vite plugin can pass it explicitly.

**Type:** `string`

#### exportName



**Type:** `string`

**Required:** yes

#### componentName



**Type:** `string`

**Required:** yes

#### mode



**Type:** `"submit" | "auto-save"`

**Required:** yes

#### componentConfig



**Type:** `ZodFormsConfig<Record<string, unknown>>`

#### ui



**Type:** `"shadcn" | "html"`

**Required:** yes

#### serverAction



**Type:** `boolean`

#### formProvider

Force FormProvider wrapper in submit mode. Auto-save mode always uses FormProvider regardless.

**Type:** `boolean`

#### validationLevel

Validation optimization level. When set, generated code uses per-field validation instead of zodResolver.

**Type:** `1 | 2 | 3`

#### schemaLite

SchemaLite for submit-time validation of top-level effects (null when no effects exist)

**Type:** `$ZodType | null`

#### schemaLiteInfo

Codegen metadata for generating the .lite.ts file

**Type:** `SchemaLiteInfo`

#### outputPath

Output path of the form component — used to compute the .lite.ts import path

**Type:** `string`
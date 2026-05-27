# Configuration

## ArrayConfig

Configuration for collection-style field add/remove buttons.
Applied via FormMeta registry on schemas rendered as `ArrayField`:
`z.array()`, `z.set()`, and `z.map()`.

### Properties

#### addLabel

Label for the "add item" button (default: "+ Add")

**Type:** `string`

#### removeLabel

Label for the "remove item" button (default: "− Remove")

**Type:** `string`

#### reorder

Enable per-row reorder affordance. When true, the renderer mounts a
registered `ArrayReorderHandle` component per row and wires it to
`useFieldArray.move()`. Off by default — existing arrays are unchanged.

**Type:** `boolean`

#### onReorder

Optional callback fired after a reorder completes. Adopters who hold a
parallel copy of the array (e.g. a graph store) mirror the change here.
`from` and `to` are zero-based indices into the form-driven array
(excluding ghost rows).

**Type:** `(from: number, to: number) => void`

#### before

Non-form rows rendered before the first form-driven row. Each entry is
a self-contained renderable; the library never inspects its contents.
Ghost rows do not participate in form state, validation, or submission.

**Type:** `GhostRow[]`

#### after

Non-form rows rendered after the last form-driven row. Same semantics as
`before`.

**Type:** `GhostRow[]`

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

Configuration for a single named schema export in `defineConfig({ schemas: ... })`.

This type mixes two scopes:
- **root-export generation settings** like `name`, `mode`, `out`, and `serverAction`
- **schema-identity defaults** like `component` and nested `fields`, which follow
  the same exported schema object anywhere it is reused as a subschema

Usage-site path overrides still win over these schema defaults.

### Properties

#### name

Override the generated top-level form component name when this schema is
selected as the root export in CLI or Vite codegen.

Root-only: nested appearances of the same subschema do not use this name.

**Type:** `string`

#### component

Default renderer for this schema wherever the same exported schema object
is encountered.

When set on a reusable subschema export (for example `ExpressionSchema`),
any parent schema that references that exact schema instance will render it
with this component unless a usage-site path override wins.

**Type:** `string`

#### mode

Root-only generation mode override for this schema export.

**Type:** `"submit" | "auto-save"`

#### out

Root-only output path override for this schema export.

**Type:** `string`

#### serverAction

Root-only server action override for this schema export.

**Type:** `boolean`

#### fields

Schema-local field configuration applied relative to this schema's own
shape.

For a root schema, these entries merge over global `fields`. For a reused
exported subschema, the same config follows that schema by identity and
becomes its default nested behavior everywhere it appears.

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

#### typesModule

When set, codegen emits `import type { StripIndexSignature } from '<typesModule>'`
and omits the inline `StripIndexSignature` type block.
When absent (default), the type is inlined for a self-contained single-file output.
The shadcn registry sets this to `'@/components/z2f'`.

**Type:** `string`
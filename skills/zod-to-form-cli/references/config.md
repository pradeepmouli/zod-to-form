# Configuration

## GenerateOptions

### Properties

#### variant

**Type:** `string`

#### config

**Type:** `string`

**Required:** yes

#### schema

**Type:** `string`

**Required:** yes

#### export

**Type:** `string`

#### mode

**Type:** `"submit" | "auto-save"`

#### out

**Type:** `string`

#### name

**Type:** `string`

#### ui

**Type:** `"shadcn" | "html"`

#### dryRun

**Type:** `boolean`

#### serverAction

**Type:** `boolean`

#### watch

**Type:** `boolean`

#### _loadedConfig

Pre-loaded config to avoid redundant file loads

**Type:** `ZodFormsConfig<Record<string, unknown>>`

## FieldConfig

Per-field configuration that customises how a Zod schema field is rendered.

Merges base options (component override, visibility, order, props) with type-aware
extras: nested `fields` for object schemas, and `arrayItems` for array schemas.
Use this type when annotating a `ZodFormsConfig.fields` record or a per-schema
`schemas.[key].fields` map.

## ZodFormsConfig

Canonical authored configuration shared by CLI, Vite, and configuration editors.
Required components.source names the import module. Generation defaults and
independent compilation live in defaults.optimization. Schemas are keyed by
exported identifier: name/mode/out/serverAction apply only to the root, while
component/fields follow schema identity when registered by the loader.

Variants are ConfigPatch layers and cannot contain nested variants.
defineConfig preserves authored values; resolveFormConfig expands the final
preset after layer merging. Component override entries and field props replace
whole entries; fields otherwise merge per property. Unknown root keys fail
validation, while field metadata supports application-specific extensions.

### Properties

#### components

**Type:** `ComponentsConfig<TComponents>`

**Required:** yes

#### variants

**Type:** `Record<string, ConfigPatch<TComponents, TSchemas>>`

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
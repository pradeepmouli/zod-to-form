# Configuration

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

## ConfigTemplateOptions

Browser-safe config template generator.
Produces the defineConfig({...}) source string used by both the CLI
init command and the playground.

### Properties

#### componentSource

Component module import path (e.g. './components/ui')

**Type:** `string`

**Required:** yes

#### componentTypeImport

Component type import specifier for generics (e.g. './components/ui')

**Type:** `string`

#### schemaTypeImport

Schema type import specifier (e.g. './schema')

**Type:** `string`

#### schemaExports

Schema export names for the schemas block

**Type:** `string[]`

#### preset

Preset name: 'shadcn' | 'html'

**Type:** `"shadcn" | "html"`

#### overrides

Component overrides (name → { controlled?: boolean })

**Type:** `Record<string, { controlled?: boolean }>`

#### defaults

Defaults block

**Type:** `{ mode?: "submit" | "auto-save"; ui?: "shadcn" | "html"; overwrite?: boolean; serverAction?: boolean; formProvider?: boolean; optimization?: { level?: 1 | 2 | 3 } }`

#### fields

Per-field overrides

**Type:** `Record<string, Record<string, unknown>>`
[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / ConfigTemplateOptions

# Type Alias: ConfigTemplateOptions

> **ConfigTemplateOptions** = `object`

Defined in: codegen/src/config-template.ts:8

Browser-safe config template generator.
Produces the defineConfig({...}) source string used by both the CLI
init command and the playground.

## Properties

### componentSource

> **componentSource**: `string`

Defined in: codegen/src/config-template.ts:12

Component module import path (e.g. './components/ui')

***

### componentTypeImport?

> `optional` **componentTypeImport?**: `string`

Defined in: codegen/src/config-template.ts:14

Component type import specifier for generics (e.g. './components/ui')

***

### config?

> `optional` **config?**: [`ZodFormsConfig`](../../cli/type-aliases/ZodFormsConfig.md)

Defined in: codegen/src/config-template.ts:10

Fully authored canonical config; serialize every public setting.

***

### defaults?

> `optional` **defaults?**: [`ConfigDefaults`](../../core/type-aliases/ConfigDefaults.md)

Defined in: codegen/src/config-template.ts:30

Defaults block

***

### fields?

> `optional` **fields?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: codegen/src/config-template.ts:32

Per-field overrides

***

### overrides?

> `optional` **overrides?**: `Record`\<`string`, \{ `controlled?`: `boolean`; `props?`: `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\>; \}\>

Defined in: codegen/src/config-template.ts:22

Component overrides (name → { controlled?: boolean; props?: ... })

***

### preset?

> `optional` **preset?**: `"shadcn"` \| `"html"`

Defined in: codegen/src/config-template.ts:20

Preset name: 'shadcn' | 'html'

***

### schemaExports?

> `optional` **schemaExports?**: `string`[]

Defined in: codegen/src/config-template.ts:18

Schema export names for the schemas block

***

### schemaTypeImport?

> `optional` **schemaTypeImport?**: `string`

Defined in: codegen/src/config-template.ts:16

Schema type import specifier (e.g. './schema')

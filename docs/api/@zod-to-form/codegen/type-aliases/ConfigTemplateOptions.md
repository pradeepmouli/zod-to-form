[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / ConfigTemplateOptions

# Type Alias: ConfigTemplateOptions

> **ConfigTemplateOptions** = `object`

Defined in: [config-template.ts:7](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/codegen/src/config-template.ts#L7)

Browser-safe config template generator.
Produces the defineConfig({...}) source string used by both the CLI
init command and the playground.

## Properties

### componentSource

> **componentSource**: `string`

Defined in: [config-template.ts:9](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/codegen/src/config-template.ts#L9)

Component module import path (e.g. './components/ui')

***

### componentTypeImport?

> `optional` **componentTypeImport?**: `string`

Defined in: [config-template.ts:11](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/codegen/src/config-template.ts#L11)

Component type import specifier for generics (e.g. './components/ui')

***

### defaults?

> `optional` **defaults?**: `object`

Defined in: [config-template.ts:21](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/codegen/src/config-template.ts#L21)

Defaults block

#### formProvider?

> `optional` **formProvider?**: `boolean`

#### mode?

> `optional` **mode?**: `"submit"` \| `"auto-save"`

#### optimization?

> `optional` **optimization?**: `object`

##### optimization.level?

> `optional` **level?**: `1` \| `2` \| `3`

#### overwrite?

> `optional` **overwrite?**: `boolean`

#### serverAction?

> `optional` **serverAction?**: `boolean`

#### ui?

> `optional` **ui?**: `"shadcn"` \| `"html"`

***

### fields?

> `optional` **fields?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: [config-template.ts:30](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/codegen/src/config-template.ts#L30)

Per-field overrides

***

### overrides?

> `optional` **overrides?**: `Record`\<`string`, \{ `controlled?`: `boolean`; \}\>

Defined in: [config-template.ts:19](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/codegen/src/config-template.ts#L19)

Component overrides (name → { controlled?: boolean })

***

### preset?

> `optional` **preset?**: `"shadcn"` \| `"html"`

Defined in: [config-template.ts:17](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/codegen/src/config-template.ts#L17)

Preset name: 'shadcn' | 'html'

***

### schemaExports?

> `optional` **schemaExports?**: `string`[]

Defined in: [config-template.ts:15](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/codegen/src/config-template.ts#L15)

Schema export names for the schemas block

***

### schemaTypeImport?

> `optional` **schemaTypeImport?**: `string`

Defined in: [config-template.ts:13](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/codegen/src/config-template.ts#L13)

Schema type import specifier (e.g. './schema')

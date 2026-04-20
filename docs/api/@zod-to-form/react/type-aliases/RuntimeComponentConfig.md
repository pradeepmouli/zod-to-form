[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / RuntimeComponentConfig

# Type Alias: RuntimeComponentConfig

> **RuntimeComponentConfig** = `object`

Defined in: [packages/react/src/FieldRenderer.tsx:10](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/react/src/FieldRenderer.tsx#L10)

## Properties

### componentModule?

> `optional` **componentModule?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/react/src/FieldRenderer.tsx:25](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/react/src/FieldRenderer.tsx#L25)

The pre-imported components module object, e.g. `import * as myComponents from './components'`.
Used to resolve component functions by name at runtime.
Section components are also resolved from this module.

***

### components

> **components**: `object`

Defined in: [packages/react/src/FieldRenderer.tsx:16](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/react/src/FieldRenderer.tsx#L16)

Component source and optional per-component overrides.
`source` is used by CLI codegen to emit a static import statement (not used at runtime).
`overrides` maps component names to `ComponentOverride` metadata (controlled, props, etc.).

#### overrides?

> `optional` **overrides?**: `Record`\<`string`, [`ComponentOverride`](../../cli/type-aliases/ComponentOverride.md)\>

#### source

> **source**: `string`

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`FieldConfig`](FieldConfig.md)\>

Defined in: [packages/react/src/FieldRenderer.tsx:26](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/react/src/FieldRenderer.tsx#L26)

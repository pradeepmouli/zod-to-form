[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / RuntimeComponentConfig

# Type Alias: RuntimeComponentConfig

> **RuntimeComponentConfig** = `object`

Defined in: [packages/react/src/FieldRenderer.tsx:10](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/react/src/FieldRenderer.tsx#L10)

## Properties

### componentModule?

> `optional` **componentModule?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/react/src/FieldRenderer.tsx:24](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/react/src/FieldRenderer.tsx#L24)

The pre-imported components module object, e.g. `import * as myComponents from './components'`.
Used to resolve component functions by name at runtime.

***

### components

> **components**: `object`

Defined in: [packages/react/src/FieldRenderer.tsx:16](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/react/src/FieldRenderer.tsx#L16)

Component source and optional per-component overrides.
`source` is used by CLI codegen to emit a static import statement (not used at runtime).
`overrides` maps component names to `ComponentOverride` metadata (controlled, propMap, etc.).

#### overrides?

> `optional` **overrides?**: `Record`\<`string`, [`ComponentOverride`](../../cli/type-aliases/ComponentOverride.md)\>

#### source

> **source**: `string`

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`FieldConfig`](FieldConfig.md)\>

Defined in: [packages/react/src/FieldRenderer.tsx:25](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/react/src/FieldRenderer.tsx#L25)

***

### sectionComponents?

> `optional` **sectionComponents?**: `Record`\<`string`, `ComponentType`\<\{ `fields`: `string`[]; \}\>\>

Defined in: [packages/react/src/FieldRenderer.tsx:30](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/react/src/FieldRenderer.tsx#L30)

Pre-imported section components, keyed by the section name used in `fields[key].section`.
Required when using section field grouping at runtime.

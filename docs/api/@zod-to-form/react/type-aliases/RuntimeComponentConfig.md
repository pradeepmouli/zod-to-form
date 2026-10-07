[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / RuntimeComponentConfig

# Type Alias: RuntimeComponentConfig

> **RuntimeComponentConfig** = `object`

Defined in: packages/react/src/FieldRenderer.tsx:20

## Properties

### componentModule?

> `optional` **componentModule?**: `Record`\<`string`, `unknown`\>

Defined in: packages/react/src/FieldRenderer.tsx:32

The pre-imported components module object, e.g. `import * as myComponents from './components'`.
Used to resolve component functions by name at runtime.
Section components are also resolved from this module.

***

### components

> **components**: [`ComponentsConfig`](../../core/type-aliases/ComponentsConfig.md)

Defined in: packages/react/src/FieldRenderer.tsx:26

Component source and optional per-component overrides.
`source` is used by CLI codegen to emit a static import statement (not used at runtime).
`overrides` maps component names to `ComponentOverride` metadata (controlled, props, etc.).

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`FieldConfig`](FieldConfig.md)\>

Defined in: packages/react/src/FieldRenderer.tsx:33

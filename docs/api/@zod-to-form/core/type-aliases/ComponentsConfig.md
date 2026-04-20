[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ComponentsConfig

# Type Alias: ComponentsConfig\<T\>

> **ComponentsConfig**\<`T`\> = `object`

Defined in: [config.ts:31](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/config.ts#L31)

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### fieldTemplate?

> `optional` **fieldTemplate?**: `string`

Defined in: [config.ts:41](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/config.ts#L41)

Custom field template component path.
Controls the composition of label + input + description + helpText + error.
Overrides the preset's default template.

***

### overrides?

> `optional` **overrides?**: `{ [K in keyof T & string]?: ComponentOverride }`

Defined in: [config.ts:43](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/config.ts#L43)

Per-component overrides, strongly typed to module export keys

***

### preset?

> `optional` **preset?**: [`ComponentPreset`](ComponentPreset.md)

Defined in: [config.ts:35](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/config.ts#L35)

Preset that provides base overrides and default field template

***

### source

> **source**: `string`

Defined in: [config.ts:33](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/config.ts#L33)

Import path for the components module

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ComponentsConfig

# Type Alias: ComponentsConfig\<T\>

> **ComponentsConfig**\<`T`\> = `object`

Defined in: config.ts:31

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### fieldTemplate?

> `optional` **fieldTemplate?**: `string`

Defined in: config.ts:41

Custom field template component path.
Controls the composition of label + input + description + helpText + error.
Overrides the preset's default template.

***

### overrides?

> `optional` **overrides?**: `{ [K in keyof T & string]?: ComponentOverride }`

Defined in: config.ts:43

Per-component overrides, strongly typed to module export keys

***

### preset?

> `optional` **preset?**: [`ComponentPreset`](ComponentPreset.md)

Defined in: config.ts:35

Preset that provides base overrides and default field template

***

### source

> **source**: `string`

Defined in: config.ts:33

Import path for the components module

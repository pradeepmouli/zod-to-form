[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ComponentsConfig

# Type Alias: ComponentsConfig\<T\>

> **ComponentsConfig**\<`T`\> = `object`

Defined in: [config.ts:24](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L24)

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### fieldTemplate?

> `optional` **fieldTemplate?**: `string`

Defined in: [config.ts:34](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L34)

Custom field template component path.
Controls the composition of label + input + description + helpText + error.
Overrides the preset's default template.

***

### overrides?

> `optional` **overrides?**: `{ [K in keyof T & string]?: ComponentOverride }`

Defined in: [config.ts:36](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L36)

Per-component overrides, strongly typed to module export keys

***

### preset?

> `optional` **preset?**: [`ComponentPreset`](ComponentPreset.md)

Defined in: [config.ts:28](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L28)

Preset that provides base overrides and default field template

***

### source

> **source**: `string`

Defined in: [config.ts:26](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/config.ts#L26)

Import path for the components module

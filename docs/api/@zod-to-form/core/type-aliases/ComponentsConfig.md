[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ComponentsConfig

# Type Alias: ComponentsConfig\<T\>

> **ComponentsConfig**\<`T`\> = `object`

Defined in: [config.ts:19](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L19)

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### overrides?

> `optional` **overrides?**: `{ [K in keyof T & string]?: ComponentOverride }`

Defined in: [config.ts:25](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L25)

Per-component overrides, strongly typed to module export keys

***

### preset?

> `optional` **preset?**: [`ComponentPreset`](ComponentPreset.md)

Defined in: [config.ts:23](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L23)

Preset that provides base overrides

***

### source

> **source**: `string`

Defined in: [config.ts:21](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L21)

Import path for the components module

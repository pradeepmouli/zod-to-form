[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / createProcessors

# Function: createProcessors()

> **createProcessors**(`custom`): `Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\>

Defined in: [registry.ts:56](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/registry.ts#L56)

Create a custom processor registry by merging with built-in processors.

## Parameters

### custom

`Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\>

Custom processors to add or override

## Returns

`Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\>

Merged processor registry

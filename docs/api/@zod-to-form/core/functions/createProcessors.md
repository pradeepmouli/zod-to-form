[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / createProcessors

# Function: createProcessors()

> **createProcessors**(`custom`): `Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\>

Defined in: [registry.ts:93](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/registry.ts#L93)

Create a custom processor registry by merging with built-in processors.
Custom entries override built-in processors for the same `def.type` key.

## Parameters

### custom

`Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\>

Additional or override processors keyed by Zod `def.type` (e.g. `'string'`, `'myCustomType'`).

## Returns

`Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\>

A merged registry of built-in and custom processors ready for use with `walkSchema`.

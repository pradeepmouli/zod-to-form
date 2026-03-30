[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ZodTypeConfig

# Type Alias: ZodTypeConfig\<TFieldKeys, TComponents\>

> **ZodTypeConfig**\<`TFieldKeys`, `TComponents`\> = `object`

Defined in: [config.ts:95](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L95)

## Type Parameters

### TFieldKeys

`TFieldKeys` *extends* `string` = `string`

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### fields?

> `optional` **fields?**: `Partial`\<`Record`\<`TFieldKeys`, [`TypedFieldConfig`](TypedFieldConfig.md)\<`TComponents`\>\>\>

Defined in: [config.ts:103](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L103)

***

### mode?

> `optional` **mode?**: `"submit"` \| `"auto-save"`

Defined in: [config.ts:100](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L100)

***

### name?

> `optional` **name?**: `string`

Defined in: [config.ts:99](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L99)

***

### out?

> `optional` **out?**: `string`

Defined in: [config.ts:101](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L101)

***

### serverAction?

> `optional` **serverAction?**: `boolean`

Defined in: [config.ts:102](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L102)

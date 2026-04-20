[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ZodTypeConfig

# Type Alias: ZodTypeConfig\<TFieldKeys, TComponents\>

> **ZodTypeConfig**\<`TFieldKeys`, `TComponents`\> = `object`

Defined in: [config.ts:102](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L102)

## Type Parameters

### TFieldKeys

`TFieldKeys` *extends* `string` = `string`

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### fields?

> `optional` **fields?**: `Partial`\<`Record`\<`TFieldKeys`, [`TypedFieldConfig`](TypedFieldConfig.md)\<`TComponents`\>\>\>

Defined in: [config.ts:110](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L110)

***

### mode?

> `optional` **mode?**: `"submit"` \| `"auto-save"`

Defined in: [config.ts:107](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L107)

***

### name?

> `optional` **name?**: `string`

Defined in: [config.ts:106](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L106)

***

### out?

> `optional` **out?**: `string`

Defined in: [config.ts:108](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L108)

***

### serverAction?

> `optional` **serverAction?**: `boolean`

Defined in: [config.ts:109](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L109)

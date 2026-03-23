[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / joinPath

# Function: joinPath()

> **joinPath**(`parent`, `key`): `string`

Defined in: [utils.ts:31](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/utils.ts#L31)

Join a parent key path with a child key.

## Parameters

### parent

`string` \| `undefined`

### key

`string`

## Returns

`string`

## Examples

```ts
joinPath(undefined, 'name') → 'name'
```

```ts
joinPath('address', 'street') → 'address.street'
```

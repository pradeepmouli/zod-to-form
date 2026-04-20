[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / joinPath

# Function: joinPath()

> **joinPath**(`parent`, `key`): `string`

Defined in: [utils.ts:42](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/core/src/utils.ts#L42)

Join a parent path and a child key with a dot separator.
Returns `key` directly when `parent` is undefined or empty.

## Parameters

### parent

`string` \| `undefined`

The parent path (e.g. `"address"`) or undefined for top-level fields.

### key

`string`

The child field key to append (e.g. `"street"`).

## Returns

`string`

The joined path (e.g. `"address.street"`) or `key` when parent is absent.

## Examples

```ts
joinPath('address', 'street') → 'address.street'
```

```ts
joinPath(undefined, 'name') → 'name'
```

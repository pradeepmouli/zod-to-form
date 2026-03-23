[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / normalizeFieldKey

# Function: normalizeFieldKey()

> **normalizeFieldKey**(`key`): `string`

Defined in: [utils.ts:236](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/utils.ts#L236)

Normalise a concrete field key to the bracket notation used in config.
Replaces `.0.`, `.${index}.`, and any `.<digits>.` segments with `[].`.

## Parameters

### key

`string`

## Returns

`string`

## Examples

```ts
normalizeFieldKey('items.0.name') → 'items[].name'
```

```ts
normalizeFieldKey('items.${index}.name') → 'items[].name'
```

```ts
normalizeFieldKey('tags.2') → 'tags[]'
```

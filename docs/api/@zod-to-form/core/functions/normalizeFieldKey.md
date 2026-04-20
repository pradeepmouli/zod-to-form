[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / normalizeFieldKey

# Function: normalizeFieldKey()

> **normalizeFieldKey**(`key`): `string`

Defined in: [utils.ts:257](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/utils.ts#L257)

Normalise a concrete field key to the bracket notation used in config.
Replaces `.0.`, `.${index}.`, and any `.<digits>.` segments with `[].`.

## Parameters

### key

`string`

A concrete field key potentially containing numeric array indices.

## Returns

`string`

The normalized key with array index segments replaced by `[]`.

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

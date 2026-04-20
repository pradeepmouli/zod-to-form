[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / normalizeFieldKey

# Function: normalizeFieldKey()

> **normalizeFieldKey**(`key`): `string`

Defined in: [utils.ts:257](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/utils.ts#L257)

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

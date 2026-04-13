[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / normalizeFieldKey

# Function: normalizeFieldKey()

> **normalizeFieldKey**(`key`): `string`

Defined in: [utils.ts:230](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/utils.ts#L230)

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

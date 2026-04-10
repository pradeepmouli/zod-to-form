[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / inferLabel

# Function: inferLabel()

> **inferLabel**(`key`): `string`

Defined in: [utils.ts:9](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/utils.ts#L9)

Convert a camelCase or snake_case key to a human-readable Title Case label.

## Parameters

### key

`string`

## Returns

`string`

## Examples

```ts
inferLabel('firstName') → 'First Name'
```

```ts
inferLabel('email_address') → 'Email Address'
```

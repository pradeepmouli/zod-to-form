[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / inferLabel

# Function: inferLabel()

> **inferLabel**(`key`): `string`

Defined in: [utils.ts:13](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/utils.ts#L13)

Convert a camelCase or snake_case key to a human-readable Title Case label.
Strips dot-path prefixes (e.g. `"address.street"` → `"Street"`) before conversion.

## Parameters

### key

`string`

A field key in camelCase, snake_case, or dot-notation path.

## Returns

`string`

A space-separated Title Case string suitable for use as a form label.

## Examples

```ts
inferLabel('firstName') → 'First Name'
```

```ts
inferLabel('email_address') → 'Email Address'
```

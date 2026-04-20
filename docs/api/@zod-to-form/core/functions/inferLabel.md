[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / inferLabel

# Function: inferLabel()

> **inferLabel**(`key`): `string`

Defined in: [utils.ts:13](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/utils.ts#L13)

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

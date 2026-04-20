[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / formatZ2FViteError

# Function: formatZ2FViteError()

> **formatZ2FViteError**(`error`): `string`

Defined in: [packages/vite/src/errors.ts:141](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/vite/src/errors.ts#L141)

Format a `Z2FViteError` for inclusion in a Vite error overlay or terminal output.
The error's `message` already includes the code prefix (`[Z2F_VITE_...]`); this function
appends the source location line when `error.location.file` is set.

## Parameters

### error

[`Z2FViteError`](../classes/Z2FViteError.md)

The `Z2FViteError` to format.

## Returns

`string`

A human-readable error string with optional file:line:column location appended.

## Example

```ts
try { ... } catch (e) {
  if (e instanceof Z2FViteError) console.error(formatZ2FViteError(e));
}
```

## Throws

Never — this function is purely a formatter.

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / Z2FViteErrorLocation

# Interface: Z2FViteErrorLocation

Defined in: [packages/vite/src/errors.ts:37](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/vite/src/errors.ts#L37)

Source location attached to a `Z2FViteError` for IDE navigation and Vite overlay display.
All properties are optional — only `file` is always available; `line`/`column` require
parse-time or AST-level context.

## Properties

### column?

> `optional` **column?**: `number`

Defined in: [packages/vite/src/errors.ts:43](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/vite/src/errors.ts#L43)

0-based column offset within the line, when available.

***

### file?

> `optional` **file?**: `string`

Defined in: [packages/vite/src/errors.ts:39](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/vite/src/errors.ts#L39)

Absolute or project-relative file path where the error originated.

***

### line?

> `optional` **line?**: `number`

Defined in: [packages/vite/src/errors.ts:41](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/vite/src/errors.ts#L41)

1-based line number within `file`, when available.

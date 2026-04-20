[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormFieldConstraints

# Interface: FormFieldConstraints

Defined in: [types.ts:74](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/types.ts#L74)

Structural constraints extracted from Zod's `_zod.bag` for a field.
Used to populate HTML validation attributes (min, max, minLength, pattern, etc.)
and to drive the L2 native-rules optimizer output.

## Properties

### format?

> `optional` **format?**: `string`

Defined in: [types.ts:86](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/types.ts#L86)

String format name (from `z.string().email()` → `'email'`, etc.).

***

### max?

> `optional` **max?**: `number`

Defined in: [types.ts:78](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/types.ts#L78)

Maximum numeric value (from `z.number().max()`).

***

### maxLength?

> `optional` **maxLength?**: `number`

Defined in: [types.ts:82](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/types.ts#L82)

Maximum string length (from `z.string().max()`).

***

### min?

> `optional` **min?**: `number`

Defined in: [types.ts:76](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/types.ts#L76)

Minimum numeric value (from `z.number().min()`).

***

### minLength?

> `optional` **minLength?**: `number`

Defined in: [types.ts:80](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/types.ts#L80)

Minimum string length (from `z.string().min()`).

***

### pattern?

> `optional` **pattern?**: `string`

Defined in: [types.ts:84](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/types.ts#L84)

Regex pattern as a string (from `z.string().regex()`).

***

### step?

> `optional` **step?**: `number`

Defined in: [types.ts:88](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/types.ts#L88)

Step constraint for numeric inputs (1 for integer-constrained fields).

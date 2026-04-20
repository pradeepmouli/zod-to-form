[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / FormFieldConstraints

# Interface: FormFieldConstraints

Defined in: packages/core/dist/types.d.ts:77

Structural constraints extracted from Zod's `_zod.bag` for a field.
Used to populate HTML validation attributes (min, max, minLength, pattern, etc.)
and to drive the L2 native-rules optimizer output.

## Properties

### format?

> `optional` **format?**: `string`

Defined in: packages/core/dist/types.d.ts:89

String format name (from `z.string().email()` → `'email'`, etc.).

***

### max?

> `optional` **max?**: `number`

Defined in: packages/core/dist/types.d.ts:81

Maximum numeric value (from `z.number().max()`).

***

### maxLength?

> `optional` **maxLength?**: `number`

Defined in: packages/core/dist/types.d.ts:85

Maximum string length (from `z.string().max()`).

***

### min?

> `optional` **min?**: `number`

Defined in: packages/core/dist/types.d.ts:79

Minimum numeric value (from `z.number().min()`).

***

### minLength?

> `optional` **minLength?**: `number`

Defined in: packages/core/dist/types.d.ts:83

Minimum string length (from `z.string().min()`).

***

### pattern?

> `optional` **pattern?**: `string`

Defined in: packages/core/dist/types.d.ts:87

Regex pattern as a string (from `z.string().regex()`).

***

### step?

> `optional` **step?**: `number`

Defined in: packages/core/dist/types.d.ts:91

Step constraint for numeric inputs (1 for integer-constrained fields).

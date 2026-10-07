[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / NativeRules

# Interface: NativeRules

Defined in: types.ts:13

Native HTML and RHF validation rules extracted from Zod constraints.
Used by L2 optimizers to produce per-field validation rules that map directly
to react-hook-form's `register()` options, bypassing the zodResolver overhead.

## Properties

### max?

> `optional` **max?**: `object`

Defined in: types.ts:19

Maximum numeric value constraint with violation message.

#### message

> **message**: `string`

#### value

> **value**: `number`

***

### maxLength?

> `optional` **maxLength?**: `object`

Defined in: types.ts:23

Maximum string length constraint with violation message.

#### message

> **message**: `string`

#### value

> **value**: `number`

***

### min?

> `optional` **min?**: `object`

Defined in: types.ts:17

Minimum numeric value constraint with violation message.

#### message

> **message**: `string`

#### value

> **value**: `number`

***

### minLength?

> `optional` **minLength?**: `object`

Defined in: types.ts:21

Minimum string length constraint with violation message.

#### message

> **message**: `string`

#### value

> **value**: `number`

***

### pattern?

> `optional` **pattern?**: `object`

Defined in: types.ts:25

Regex pattern constraint with violation message.

#### message

> **message**: `string`

#### value

> **value**: `RegExp`

***

### required?

> `optional` **required?**: `string`

Defined in: types.ts:15

Required validation message shown when field is empty.

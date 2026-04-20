[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / NativeRules

# Interface: NativeRules

Defined in: [types.ts:13](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L13)

Native HTML and RHF validation rules extracted from Zod constraints.
Used by L2 optimizers to produce per-field validation rules that map directly
to react-hook-form's `register()` options, bypassing the zodResolver overhead.

## Properties

### max?

> `optional` **max?**: `object`

Defined in: [types.ts:19](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L19)

Maximum numeric value constraint with violation message.

#### message

> **message**: `string`

#### value

> **value**: `number`

***

### maxLength?

> `optional` **maxLength?**: `object`

Defined in: [types.ts:23](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L23)

Maximum string length constraint with violation message.

#### message

> **message**: `string`

#### value

> **value**: `number`

***

### min?

> `optional` **min?**: `object`

Defined in: [types.ts:17](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L17)

Minimum numeric value constraint with violation message.

#### message

> **message**: `string`

#### value

> **value**: `number`

***

### minLength?

> `optional` **minLength?**: `object`

Defined in: [types.ts:21](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L21)

Minimum string length constraint with violation message.

#### message

> **message**: `string`

#### value

> **value**: `number`

***

### pattern?

> `optional` **pattern?**: `object`

Defined in: [types.ts:25](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L25)

Regex pattern constraint with violation message.

#### message

> **message**: `string`

#### value

> **value**: `RegExp`

***

### required?

> `optional` **required?**: `string`

Defined in: [types.ts:15](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/types.ts#L15)

Required validation message shown when field is empty.

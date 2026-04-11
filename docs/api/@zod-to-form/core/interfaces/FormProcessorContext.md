[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormProcessorContext

# Interface: FormProcessorContext

Defined in: [types.ts:180](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L180)

## Properties

### currentDepth

> **currentDepth**: `number`

Defined in: [types.ts:192](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L192)

Current recursion depth

***

### formRegistry?

> `optional` **formRegistry?**: [`ZodFormRegistry`](../type-aliases/ZodFormRegistry.md)

Defined in: [types.ts:184](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L184)

Form-specific metadata registry

***

### maxDepth

> **maxDepth**: `number`

Defined in: [types.ts:190](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L190)

Maximum recursion depth (default: 5)

***

### path

> **path**: `string`[]

Defined in: [types.ts:186](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L186)

Current field path stack

***

### processChild?

> `optional` **processChild?**: (`schema`, `key`) => [`FormField`](FormField.md)

Defined in: [types.ts:198](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L198)

Process a child schema into a FormField.
Provided by the walker for use in nesting processors (object, array, union).
Undefined only in unit-test contexts where nesting is not being tested.

#### Parameters

##### schema

`$ZodType`

##### key

`string`

#### Returns

[`FormField`](FormField.md)

***

### processors

> **processors**: `Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\>

Defined in: [types.ts:182](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L182)

Registry mapping def.type → processor function

***

### seen

> **seen**: `WeakSet`\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>

Defined in: [types.ts:188](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L188)

Tracks visited schema objects — prevents infinite loops from recursive schemas and avoids re-processing the same reference

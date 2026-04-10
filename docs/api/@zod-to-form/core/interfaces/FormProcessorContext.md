[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormProcessorContext

# Interface: FormProcessorContext

Defined in: [types.ts:167](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L167)

## Properties

### currentDepth

> **currentDepth**: `number`

Defined in: [types.ts:179](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L179)

Current recursion depth

***

### formRegistry?

> `optional` **formRegistry?**: [`ZodFormRegistry`](../type-aliases/ZodFormRegistry.md)

Defined in: [types.ts:171](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L171)

Form-specific metadata registry

***

### maxDepth

> **maxDepth**: `number`

Defined in: [types.ts:177](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L177)

Maximum recursion depth (default: 5)

***

### path

> **path**: `string`[]

Defined in: [types.ts:173](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L173)

Current field path stack

***

### processChild?

> `optional` **processChild?**: (`schema`, `key`) => [`FormField`](FormField.md)

Defined in: [types.ts:185](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L185)

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

Defined in: [types.ts:169](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L169)

Registry mapping def.type → processor function

***

### seen

> **seen**: `WeakSet`\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>

Defined in: [types.ts:175](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L175)

Tracks visited schema objects — prevents infinite loops from recursive schemas and avoids re-processing the same reference

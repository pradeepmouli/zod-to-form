[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormProcessorContext

# Interface: FormProcessorContext

Defined in: [types.ts:177](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L177)

## Properties

### currentDepth

> **currentDepth**: `number`

Defined in: [types.ts:189](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L189)

Current recursion depth

***

### formRegistry?

> `optional` **formRegistry?**: [`ZodFormRegistry`](../type-aliases/ZodFormRegistry.md)

Defined in: [types.ts:181](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L181)

Form-specific metadata registry

***

### maxDepth

> **maxDepth**: `number`

Defined in: [types.ts:187](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L187)

Maximum recursion depth (default: 5)

***

### path

> **path**: `string`[]

Defined in: [types.ts:183](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L183)

Current field path stack

***

### processChild?

> `optional` **processChild?**: (`schema`, `key`) => [`FormField`](FormField.md)

Defined in: [types.ts:195](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L195)

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

Defined in: [types.ts:179](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L179)

Registry mapping def.type → processor function

***

### seen

> **seen**: `WeakSet`\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>

Defined in: [types.ts:185](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/types.ts#L185)

Tracks visited schema objects — prevents infinite loops from recursive schemas and avoids re-processing the same reference

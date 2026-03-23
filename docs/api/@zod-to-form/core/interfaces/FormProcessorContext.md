[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormProcessorContext

# Interface: FormProcessorContext

Defined in: [types.ts:118](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L118)

## Properties

### currentDepth

> **currentDepth**: `number`

Defined in: [types.ts:130](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L130)

Current recursion depth

***

### formRegistry?

> `optional` **formRegistry?**: [`ZodFormRegistry`](../type-aliases/ZodFormRegistry.md)

Defined in: [types.ts:122](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L122)

Form-specific metadata registry

***

### maxDepth

> **maxDepth**: `number`

Defined in: [types.ts:128](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L128)

Maximum recursion depth (default: 5)

***

### path

> **path**: `string`[]

Defined in: [types.ts:124](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L124)

Current field path stack

***

### processChild?

> `optional` **processChild?**: (`schema`, `key`) => [`FormField`](FormField.md)

Defined in: [types.ts:136](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L136)

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

Defined in: [types.ts:120](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L120)

Registry mapping def.type → processor function

***

### seen

> **seen**: `WeakSet`\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>

Defined in: [types.ts:126](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L126)

Tracks visited schema objects — prevents infinite loops from recursive schemas and avoids re-processing the same reference

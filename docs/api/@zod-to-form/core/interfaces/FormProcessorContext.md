[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormProcessorContext

# Interface: FormProcessorContext

Defined in: types.ts:335

Runtime context passed to every processor during a walkSchema traversal.
Provides the processor registry, form registry, path tracking, cycle detection,
and a child-processing callback for recursive types (object, array, union).

## Properties

### currentDepth

> **currentDepth**: `number`

Defined in: types.ts:347

Current recursion depth

***

### formRegistry?

> `optional` **formRegistry?**: [`ZodFormRegistry`](../type-aliases/ZodFormRegistry.md)

Defined in: types.ts:339

Form-specific metadata registry

***

### maxDepth

> **maxDepth**: `number`

Defined in: types.ts:345

Maximum recursion depth (default: 5)

***

### path

> **path**: `string`[]

Defined in: types.ts:341

Current field path stack

***

### processChild?

> `optional` **processChild?**: (`schema`, `key`) => [`FormField`](FormField.md)

Defined in: types.ts:353

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

Defined in: types.ts:337

Registry mapping def.type → processor function

***

### seen

> **seen**: `WeakSet`\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>

Defined in: types.ts:343

Tracks visited schema objects — prevents infinite loops from recursive schemas and avoids re-processing the same reference

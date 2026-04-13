[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormField

# Interface: FormField

Defined in: [types.ts:43](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L43)

## Properties

### arrayItem?

> `optional` **arrayItem?**: `FormField`

Defined in: [types.ts:77](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L77)

Template for array items

***

### children?

> `optional` **children?**: `FormField`[]

Defined in: [types.ts:75](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L75)

Children for nested objects

***

### component

> **component**: `string`

Defined in: [types.ts:47](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L47)

Component name from ComponentMap, e.g. "Input", "Select", "Textarea"

***

### constraints

> **constraints**: [`FormFieldConstraints`](FormFieldConstraints.md)

Defined in: [types.ts:79](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L79)

Validation constraints extracted from Zod v4 constraint bag (_zod.bag)

***

### defaultValue?

> `optional` **defaultValue?**: `unknown`

Defined in: [types.ts:59](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L59)

Default value from z.default() or metadata

***

### deprecated

> **deprecated**: `boolean`

Defined in: [types.ts:71](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L71)

Whether the field is marked as deprecated in the schema registry

***

### description?

> `optional` **description?**: `string`

Defined in: [types.ts:53](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L53)

Help text from .describe() or .meta()

***

### disabled

> **disabled**: `boolean`

Defined in: [types.ts:67](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L67)

Non-interactive state (greyed out)

***

### hasCustomRender?

> `optional` **hasCustomRender?**: `boolean`

Defined in: [types.ts:83](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L83)

Whether a custom render function is registered for this field (runtime only)

***

### helpText?

> `optional` **helpText?**: `string`

Defined in: [types.ts:69](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L69)

Help text rendered below the input, distinct from description (below label)

***

### hidden

> **hidden**: `boolean`

Defined in: [types.ts:63](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L63)

Hidden but present in form state

***

### key

> **key**: `string`

Defined in: [types.ts:45](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L45)

Field path, e.g. "name", "address.street", "items.0.name"

***

### label

> **label**: `string`

Defined in: [types.ts:51](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L51)

Display label

***

### options?

> `optional` **options?**: [`FormFieldOption`](FormFieldOption.md)[]

Defined in: [types.ts:73](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L73)

Options for enum/union select fields

***

### order?

> `optional` **order?**: `number`

Defined in: [types.ts:65](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L65)

Display order override from form registry

***

### placeholder?

> `optional` **placeholder?**: `string`

Defined in: [types.ts:55](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L55)

Placeholder from examples[0] or metadata

***

### props

> **props**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:49](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L49)

Pass-through props for the component

***

### readOnly

> **readOnly**: `boolean`

Defined in: [types.ts:61](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L61)

Read-only from z.readonly() or metadata

***

### render?

> `optional` **render?**: (`field`, `props`) => `unknown`

Defined in: [types.ts:85](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L85)

Custom render function from FormMeta (runtime only, not serialisable)

#### Parameters

##### field

`FormField`

##### props

`Record`\<`string`, `unknown`\>

#### Returns

`unknown`

***

### required

> **required**: `boolean`

Defined in: [types.ts:57](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L57)

Whether the field is required

***

### validation?

> `optional` **validation?**: [`ValidationStrategy`](ValidationStrategy.md)

Defined in: [types.ts:89](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L89)

Validation strategy set by optimizers (undefined = use zodResolver)

***

### zodSchema?

> `optional` **zodSchema?**: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

Defined in: [types.ts:87](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L87)

Atomic Zod schema for this field, set by L1 optimizer

***

### zodType

> **zodType**: `string`

Defined in: [types.ts:81](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/types.ts#L81)

Original Zod def.type for reference

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormField

# Interface: FormField

Defined in: [types.ts:42](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L42)

## Properties

### arrayItem?

> `optional` **arrayItem?**: `FormField`

Defined in: [types.ts:76](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L76)

Template for array items

***

### children?

> `optional` **children?**: `FormField`[]

Defined in: [types.ts:74](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L74)

Children for nested objects

***

### component

> **component**: `string`

Defined in: [types.ts:46](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L46)

Component name from ComponentMap, e.g. "Input", "Select", "Textarea"

***

### constraints

> **constraints**: [`FormFieldConstraints`](FormFieldConstraints.md)

Defined in: [types.ts:78](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L78)

Validation constraints extracted from Zod v4 constraint bag (_zod.bag)

***

### defaultValue?

> `optional` **defaultValue?**: `unknown`

Defined in: [types.ts:58](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L58)

Default value from z.default() or metadata

***

### deprecated

> **deprecated**: `boolean`

Defined in: [types.ts:70](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L70)

Whether the field is marked as deprecated in the schema registry

***

### description?

> `optional` **description?**: `string`

Defined in: [types.ts:52](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L52)

Help text from .describe() or .meta()

***

### disabled

> **disabled**: `boolean`

Defined in: [types.ts:66](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L66)

Non-interactive state (greyed out)

***

### hasCustomRender?

> `optional` **hasCustomRender?**: `boolean`

Defined in: [types.ts:82](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L82)

Whether a custom render function is registered for this field (runtime only)

***

### helpText?

> `optional` **helpText?**: `string`

Defined in: [types.ts:68](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L68)

Help text rendered below the input, distinct from description (below label)

***

### hidden

> **hidden**: `boolean`

Defined in: [types.ts:62](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L62)

Hidden but present in form state

***

### key

> **key**: `string`

Defined in: [types.ts:44](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L44)

Field path, e.g. "name", "address.street", "items.0.name"

***

### label

> **label**: `string`

Defined in: [types.ts:50](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L50)

Display label

***

### options?

> `optional` **options?**: [`FormFieldOption`](FormFieldOption.md)[]

Defined in: [types.ts:72](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L72)

Options for enum/union select fields

***

### order?

> `optional` **order?**: `number`

Defined in: [types.ts:64](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L64)

Display order override from form registry

***

### placeholder?

> `optional` **placeholder?**: `string`

Defined in: [types.ts:54](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L54)

Placeholder from examples[0] or metadata

***

### props

> **props**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:48](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L48)

Pass-through props for the component

***

### readOnly

> **readOnly**: `boolean`

Defined in: [types.ts:60](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L60)

Read-only from z.readonly() or metadata

***

### render?

> `optional` **render?**: (`field`, `props`) => `unknown`

Defined in: [types.ts:84](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L84)

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

Defined in: [types.ts:56](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L56)

Whether the field is required

***

### validation?

> `optional` **validation?**: [`ValidationStrategy`](ValidationStrategy.md)

Defined in: [types.ts:88](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L88)

Validation strategy set by optimizers (undefined = use zodResolver)

***

### zodSchema?

> `optional` **zodSchema?**: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

Defined in: [types.ts:86](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L86)

Atomic Zod schema for this field, set by L1 optimizer

***

### zodType

> **zodType**: `string`

Defined in: [types.ts:80](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/types.ts#L80)

Original Zod def.type for reference

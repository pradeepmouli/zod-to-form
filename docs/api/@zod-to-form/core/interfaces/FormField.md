[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormField

# Interface: FormField

Defined in: [types.ts:21](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L21)

## Properties

### arrayItem?

> `optional` **arrayItem?**: `FormField`

Defined in: [types.ts:51](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L51)

Template for array items

***

### children?

> `optional` **children?**: `FormField`[]

Defined in: [types.ts:49](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L49)

Children for nested objects

***

### component

> **component**: `string`

Defined in: [types.ts:25](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L25)

Component name from ComponentMap, e.g. "Input", "Select", "Textarea"

***

### constraints

> **constraints**: [`FormFieldConstraints`](FormFieldConstraints.md)

Defined in: [types.ts:53](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L53)

Validation constraints extracted from Zod v4 constraint bag (_zod.bag)

***

### defaultValue?

> `optional` **defaultValue?**: `unknown`

Defined in: [types.ts:37](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L37)

Default value from z.default() or metadata

***

### description?

> `optional` **description?**: `string`

Defined in: [types.ts:31](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L31)

Help text from .describe() or .meta()

***

### gridColumn?

> `optional` **gridColumn?**: `string`

Defined in: [types.ts:45](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L45)

CSS grid-column hint from form registry

***

### hasCustomRender?

> `optional` **hasCustomRender?**: `boolean`

Defined in: [types.ts:57](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L57)

Whether a custom render function is registered for this field (runtime only)

***

### hidden

> **hidden**: `boolean`

Defined in: [types.ts:41](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L41)

Hidden but present in form state

***

### key

> **key**: `string`

Defined in: [types.ts:23](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L23)

Field path, e.g. "name", "address.street", "items.0.name"

***

### label

> **label**: `string`

Defined in: [types.ts:29](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L29)

Display label

***

### options?

> `optional` **options?**: [`FormFieldOption`](FormFieldOption.md)[]

Defined in: [types.ts:47](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L47)

Options for enum/union select fields

***

### order?

> `optional` **order?**: `number`

Defined in: [types.ts:43](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L43)

Display order override from form registry

***

### placeholder?

> `optional` **placeholder?**: `string`

Defined in: [types.ts:33](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L33)

Placeholder from examples[0] or metadata

***

### props

> **props**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:27](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L27)

Pass-through props for the component

***

### readOnly

> **readOnly**: `boolean`

Defined in: [types.ts:39](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L39)

Read-only from z.readonly() or metadata

***

### render?

> `optional` **render?**: (`field`, `props`) => `unknown`

Defined in: [types.ts:59](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L59)

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

Defined in: [types.ts:35](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L35)

Whether the field is required

***

### zodType

> **zodType**: `string`

Defined in: [types.ts:55](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L55)

Original Zod def.type for reference

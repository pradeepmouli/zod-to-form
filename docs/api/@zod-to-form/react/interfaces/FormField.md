[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / FormField

# Interface: FormField

Defined in: packages/core/dist/types.d.ts:16

## Properties

### arrayItem?

> `optional` **arrayItem?**: `FormField`

Defined in: packages/core/dist/types.d.ts:46

Template for array items

***

### children?

> `optional` **children?**: `FormField`[]

Defined in: packages/core/dist/types.d.ts:44

Children for nested objects

***

### component

> **component**: `string`

Defined in: packages/core/dist/types.d.ts:20

Component name from ComponentMap, e.g. "Input", "Select", "Textarea"

***

### constraints

> **constraints**: [`FormFieldConstraints`](FormFieldConstraints.md)

Defined in: packages/core/dist/types.d.ts:48

Validation constraints extracted from Zod v4 constraint bag (_zod.bag)

***

### defaultValue?

> `optional` **defaultValue?**: `unknown`

Defined in: packages/core/dist/types.d.ts:32

Default value from z.default() or metadata

***

### description?

> `optional` **description?**: `string`

Defined in: packages/core/dist/types.d.ts:26

Help text from .describe() or .meta()

***

### gridColumn?

> `optional` **gridColumn?**: `string`

Defined in: packages/core/dist/types.d.ts:40

CSS grid-column hint from form registry

***

### hasCustomRender?

> `optional` **hasCustomRender?**: `boolean`

Defined in: packages/core/dist/types.d.ts:52

Whether a custom render function is registered for this field (runtime only)

***

### hidden

> **hidden**: `boolean`

Defined in: packages/core/dist/types.d.ts:36

Hidden but present in form state

***

### key

> **key**: `string`

Defined in: packages/core/dist/types.d.ts:18

Field path, e.g. "name", "address.street", "items.0.name"

***

### label

> **label**: `string`

Defined in: packages/core/dist/types.d.ts:24

Display label

***

### options?

> `optional` **options?**: [`FormFieldOption`](FormFieldOption.md)[]

Defined in: packages/core/dist/types.d.ts:42

Options for enum/union select fields

***

### order?

> `optional` **order?**: `number`

Defined in: packages/core/dist/types.d.ts:38

Display order override from form registry

***

### placeholder?

> `optional` **placeholder?**: `string`

Defined in: packages/core/dist/types.d.ts:28

Placeholder from examples[0] or metadata

***

### props

> **props**: `Record`\<`string`, `unknown`\>

Defined in: packages/core/dist/types.d.ts:22

Pass-through props for the component

***

### readOnly

> **readOnly**: `boolean`

Defined in: packages/core/dist/types.d.ts:34

Read-only from z.readonly() or metadata

***

### render?

> `optional` **render?**: (`field`, `props`) => `unknown`

Defined in: packages/core/dist/types.d.ts:54

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

Defined in: packages/core/dist/types.d.ts:30

Whether the field is required

***

### zodType

> **zodType**: `string`

Defined in: packages/core/dist/types.d.ts:50

Original Zod def.type for reference

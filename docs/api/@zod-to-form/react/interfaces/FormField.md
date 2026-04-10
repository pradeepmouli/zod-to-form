[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / FormField

# Interface: FormField

Defined in: packages/core/dist/types.d.ts:44

## Properties

### arrayItem?

> `optional` **arrayItem?**: `FormField`

Defined in: packages/core/dist/types.d.ts:78

Template for array items

***

### children?

> `optional` **children?**: `FormField`[]

Defined in: packages/core/dist/types.d.ts:76

Children for nested objects

***

### component

> **component**: `string`

Defined in: packages/core/dist/types.d.ts:48

Component name from ComponentMap, e.g. "Input", "Select", "Textarea"

***

### constraints

> **constraints**: [`FormFieldConstraints`](FormFieldConstraints.md)

Defined in: packages/core/dist/types.d.ts:80

Validation constraints extracted from Zod v4 constraint bag (_zod.bag)

***

### defaultValue?

> `optional` **defaultValue?**: `unknown`

Defined in: packages/core/dist/types.d.ts:60

Default value from z.default() or metadata

***

### deprecated

> **deprecated**: `boolean`

Defined in: packages/core/dist/types.d.ts:72

Whether the field is marked as deprecated in the schema registry

***

### description?

> `optional` **description?**: `string`

Defined in: packages/core/dist/types.d.ts:54

Help text from .describe() or .meta()

***

### disabled

> **disabled**: `boolean`

Defined in: packages/core/dist/types.d.ts:68

Non-interactive state (greyed out)

***

### hasCustomRender?

> `optional` **hasCustomRender?**: `boolean`

Defined in: packages/core/dist/types.d.ts:84

Whether a custom render function is registered for this field (runtime only)

***

### helpText?

> `optional` **helpText?**: `string`

Defined in: packages/core/dist/types.d.ts:70

Help text rendered below the input, distinct from description (below label)

***

### hidden

> **hidden**: `boolean`

Defined in: packages/core/dist/types.d.ts:64

Hidden but present in form state

***

### key

> **key**: `string`

Defined in: packages/core/dist/types.d.ts:46

Field path, e.g. "name", "address.street", "items.0.name"

***

### label

> **label**: `string`

Defined in: packages/core/dist/types.d.ts:52

Display label

***

### options?

> `optional` **options?**: [`FormFieldOption`](FormFieldOption.md)[]

Defined in: packages/core/dist/types.d.ts:74

Options for enum/union select fields

***

### order?

> `optional` **order?**: `number`

Defined in: packages/core/dist/types.d.ts:66

Display order override from form registry

***

### placeholder?

> `optional` **placeholder?**: `string`

Defined in: packages/core/dist/types.d.ts:56

Placeholder from examples[0] or metadata

***

### props

> **props**: `Record`\<`string`, `unknown`\>

Defined in: packages/core/dist/types.d.ts:50

Pass-through props for the component

***

### readOnly

> **readOnly**: `boolean`

Defined in: packages/core/dist/types.d.ts:62

Read-only from z.readonly() or metadata

***

### render?

> `optional` **render?**: (`field`, `props`) => `unknown`

Defined in: packages/core/dist/types.d.ts:86

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

Defined in: packages/core/dist/types.d.ts:58

Whether the field is required

***

### validation?

> `optional` **validation?**: [`ValidationStrategy`](../../core/interfaces/ValidationStrategy.md)

Defined in: packages/core/dist/types.d.ts:90

Validation strategy set by optimizers (undefined = use zodResolver)

***

### zodSchema?

> `optional` **zodSchema?**: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

Defined in: packages/core/dist/types.d.ts:88

Atomic Zod schema for this field, set by L1 optimizer

***

### zodType

> **zodType**: `string`

Defined in: packages/core/dist/types.d.ts:82

Original Zod def.type for reference

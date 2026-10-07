[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / ZodFormSwitchProps

# Interface: ZodFormSwitchProps\<TSource, TKey, TSchemas\>

Defined in: packages/react/src/ZodFormSwitch.tsx:20

Props for [ZodFormSwitch](../functions/ZodFormSwitch.md).

## Type Parameters

### TSource

`TSource` *extends* `Record`\<`string`, `unknown`\>

### TKey

`TKey` *extends* keyof `TSource` & `string`

### TSchemas

`TSchemas` *extends* `Record`\<`string`, `ZodObject`\>

## Properties

### className?

> `optional` **className?**: `string`

Defined in: packages/react/src/ZodFormSwitch.tsx:48

Forwarded to the rendered <ZodForm>.

***

### componentConfig?

> `optional` **componentConfig?**: [`RuntimeComponentConfig`](../type-aliases/RuntimeComponentConfig.md)

Defined in: packages/react/src/ZodFormSwitch.tsx:44

Forwarded to the rendered <ZodForm>.

***

### components?

> `optional` **components?**: `Partial`\<`Record`\<`"Field"` \| `"FieldLabel"` \| `"FieldDescription"` \| `"FieldMessage"` \| `"ArrayAddButton"` \| `"ArrayRemoveButton"` \| `"ArrayReorderHandle"` \| `"Input"` \| `"Textarea"` \| `"Checkbox"` \| `"Combobox"` \| `"Switch"` \| `"Select"` \| `"DatePicker"` \| `"FileInput"` \| `"RadioGroup"`, `ComponentType`\<`any`\>\>\>

Defined in: packages/react/src/ZodFormSwitch.tsx:42

Forwarded to the rendered <ZodForm>.

***

### discriminator

> **discriminator**: `TKey`

Defined in: packages/react/src/ZodFormSwitch.tsx:32

Property name on `source` to use as the discriminator.

***

### errorDisplay?

> `optional` **errorDisplay?**: `"always"` \| `"afterTouched"`

Defined in: packages/react/src/ZodFormSwitch.tsx:50

Forwarded to the rendered <ZodForm>.

***

### fallback?

> `optional` **fallback?**: `ReactNode` \| ((`source`) => `ReactNode`)

Defined in: packages/react/src/ZodFormSwitch.tsx:40

Component(s) to render when the discriminator value matches no
schema. ReactNode for static fallback; function for dynamic.
The function form receives the (possibly nullish) source.

***

### onValueChange?

> `optional` **onValueChange?**: (`data`, `meta`) => `void`

Defined in: packages/react/src/ZodFormSwitch.tsx:46

Forwarded to the rendered <ZodForm>.

#### Parameters

##### data

`unknown`

##### meta

###### isValid

`boolean`

#### Returns

`void`

***

### schemas

> **schemas**: `TSchemas`

Defined in: packages/react/src/ZodFormSwitch.tsx:34

Map from discriminator values to Zod schemas.

***

### source

> **source**: `TSource` \| `null` \| `undefined`

Defined in: packages/react/src/ZodFormSwitch.tsx:30

Source object whose `[discriminator]` value selects the schema.
`null` / `undefined` are valid and route to `fallback` (or to a one-time
warning + `null` render if no fallback is provided).

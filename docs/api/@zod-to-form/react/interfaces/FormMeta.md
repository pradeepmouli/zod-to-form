[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / FormMeta

# Interface: FormMeta

Defined in: packages/core/dist/types.d.ts:90

## Extends

- [`FieldConfig`](../type-aliases/FieldConfig.md)

## Properties

### arrayItems?

> `optional` **arrayItems?**: [`FieldConfig`](../type-aliases/FieldConfig.md)\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>

Defined in: packages/core/dist/types.d.ts:79

#### Inherited from

`FieldConfig.arrayItems`

***

### component?

> `optional` **component?**: `string`

Defined in: packages/core/dist/types.d.ts:58

Component name override, e.g. "Textarea", "Switch", "Combobox"

#### Inherited from

`FieldConfig.component`

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`FieldConfig`](../type-aliases/FieldConfig.md)\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>\>

Defined in: packages/core/dist/types.d.ts:78

#### Inherited from

`FieldConfig.fields`

***

### gridColumn?

> `optional` **gridColumn?**: `string`

Defined in: packages/core/dist/types.d.ts:64

CSS grid column hint

#### Inherited from

`FieldConfig.gridColumn`

***

### hidden?

> `optional` **hidden?**: `boolean`

Defined in: packages/core/dist/types.d.ts:62

Hide field from UI (remains in form state)

#### Inherited from

`FieldConfig.hidden`

***

### order?

> `optional` **order?**: `number`

Defined in: packages/core/dist/types.d.ts:60

Display order override

#### Inherited from

`FieldConfig.order`

***

### propMap?

> `optional` **propMap?**: `Record`\<`string`, `string`\>

Defined in: packages/core/dist/types.d.ts:68

Per-field prop mapping override (merges over ComponentOverride.propMap)

#### Inherited from

`FieldConfig.propMap`

***

### props?

> `optional` **props?**: `Record`\<`string`, `unknown`\>

Defined in: packages/core/dist/types.d.ts:66

Arbitrary field metadata props forwarded by processors

#### Inherited from

`FieldConfig.props`

***

### render?

> `optional` **render?**: (`field`, `props`) => `unknown`

Defined in: packages/core/dist/types.d.ts:92

Custom render function (runtime only, ignored in codegen)

#### Parameters

##### field

[`FormField`](FormField.md)

##### props

`unknown`

#### Returns

`unknown`

***

### section?

> `optional` **section?**: `string`

Defined in: packages/core/dist/types.d.ts:75

Group this field into a named section component.
Fields sharing the same section value are suppressed individually
and rendered once via `<SectionComponent fields={[...fieldNames]} />`.
The section component reads its fields from FormProvider context.

#### Inherited from

`FieldConfig.section`

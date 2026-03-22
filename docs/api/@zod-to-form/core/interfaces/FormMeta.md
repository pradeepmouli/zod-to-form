[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormMeta

# Interface: FormMeta

Defined in: [types.ts:102](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L102)

## Extends

- [`FieldConfig`](../type-aliases/FieldConfig.md)

## Properties

### arrayItems?

> `optional` **arrayItems?**: [`FieldConfig`](../type-aliases/FieldConfig.md)\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>

Defined in: [types.ts:89](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L89)

#### Inherited from

`FieldConfig.arrayItems`

***

### component?

> `optional` **component?**: `string`

Defined in: [types.ts:66](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L66)

Component name override, e.g. "Textarea", "Switch", "Combobox"

#### Inherited from

`FieldConfig.component`

***

### fields?

> `optional` **fields?**: `Record`\<`string`, [`FieldConfig`](../type-aliases/FieldConfig.md)\<`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>\>

Defined in: [types.ts:89](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L89)

#### Inherited from

`FieldConfig.fields`

***

### gridColumn?

> `optional` **gridColumn?**: `string`

Defined in: [types.ts:72](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L72)

CSS grid column hint

#### Inherited from

`FieldConfig.gridColumn`

***

### hidden?

> `optional` **hidden?**: `boolean`

Defined in: [types.ts:70](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L70)

Hide field from UI (remains in form state)

#### Inherited from

`FieldConfig.hidden`

***

### order?

> `optional` **order?**: `number`

Defined in: [types.ts:68](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L68)

Display order override

#### Inherited from

`FieldConfig.order`

***

### propMap?

> `optional` **propMap?**: `Record`\<`string`, `string`\>

Defined in: [types.ts:76](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L76)

Per-field prop mapping override (merges over ComponentOverride.propMap)

#### Inherited from

`FieldConfig.propMap`

***

### props?

> `optional` **props?**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:74](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L74)

Arbitrary field metadata props forwarded by processors

#### Inherited from

`FieldConfig.props`

***

### render?

> `optional` **render?**: (`field`, `props`) => `unknown`

Defined in: [types.ts:104](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L104)

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

Defined in: [types.ts:83](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/types.ts#L83)

Group this field into a named section component.
Fields sharing the same section value are suppressed individually
and rendered once via `<SectionComponent fields={[...fieldNames]} />`.
The section component reads its fields from FormProvider context.

#### Inherited from

`FieldConfig.section`

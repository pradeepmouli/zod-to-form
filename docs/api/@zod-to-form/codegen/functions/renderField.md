[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / renderField

# Function: renderField()

> **renderField**(`field`, `regExpr?`): `string`

Defined in: [codegen/src/templates.ts:279](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/codegen/src/templates.ts#L279)

Render a single `FormField` to its plain-HTML JSX string.
Dispatches on `field.component` to produce the correct input element.
Used by the html-preset code generator for uncontrolled forms.

## Parameters

### field

[`FormField`](../../core/interfaces/FormField.md)

The FormField to render.

### regExpr?

`string`

Optional pre-built `register(...)` expression string. If omitted, generated from `field.key`.

## Returns

`string`

A JSX string for the field's input element (e.g. `<input type="text" {...register('name')} />`).

## Example

```ts
renderField({ component: 'Input', key: 'name', props: { type: 'text' }, ... }) → "<input ... />"
```

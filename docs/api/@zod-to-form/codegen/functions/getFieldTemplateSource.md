[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / getFieldTemplateSource

# Function: getFieldTemplateSource()

> **getFieldTemplateSource**(`preset`): `string`

Defined in: [codegen/src/field-templates.ts:122](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/codegen/src/field-templates.ts#L122)

Return the source code for the preset's `FieldTemplate` React component.
Used by the CLI `generate` and `init` commands to emit a standalone `FieldTemplate.tsx`
alongside generated forms.

## Parameters

### preset

`"shadcn"` \| `"html"`

The preset name: `'shadcn'` for Radix/shadcn-ui, `'html'` for plain HTML.

## Returns

`string`

The complete `FieldTemplate.tsx` source string for the chosen preset.

## Example

```ts
const source = getFieldTemplateSource('shadcn');
await fs.writeFile('src/components/FieldTemplate.tsx', source);
```

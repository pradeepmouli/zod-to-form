[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / SectionRenderer

# Function: SectionRenderer()

> **SectionRenderer**(`__namedParameters`): `Element`

Defined in: packages/react/src/ZodForm.tsx:188

Renders section components that group multiple form fields.
Each section component receives a `fields` prop with the field names it manages,
and reads/writes its fields via useFormContext (FormProvider).
Section components are resolved by name from `componentConfig.componentModule`.
Use with `collectFieldSections` inside an existing FormProvider to compose
custom layouts without creating a second form or duplicating section rendering.

## Parameters

### \_\_namedParameters

#### componentConfig?

`Pick`\<[`RuntimeComponentConfig`](../type-aliases/RuntimeComponentConfig.md), `"componentModule"`\>

#### sections

`ReadonlyMap`\<`string`, `string`[]\>

## Returns

`Element`

[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / FormFieldOption

# Interface: FormFieldOption

Defined in: packages/core/dist/types.d.ts:62

An individual option in a Select, RadioGroup, or similar enum-driven component.
Generated from z.enum(), z.literal(), and z.union() of literals by their processors.

## Properties

### disabled?

> `optional` **disabled?**: `boolean`

Defined in: packages/core/dist/types.d.ts:68

When true, the option is shown but cannot be selected.

***

### label

> **label**: `string`

Defined in: packages/core/dist/types.d.ts:66

Human-readable label displayed in the Select, RadioGroup, or Combobox.

***

### value

> **value**: `string` \| `number`

Defined in: packages/core/dist/types.d.ts:64

The option value submitted with the form (must be string or number for HTML compatibility).

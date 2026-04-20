[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormFieldOption

# Interface: FormFieldOption

Defined in: [types.ts:58](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L58)

An individual option in a Select, RadioGroup, or similar enum-driven component.
Generated from z.enum(), z.literal(), and z.union() of literals by their processors.

## Properties

### disabled?

> `optional` **disabled?**: `boolean`

Defined in: [types.ts:64](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L64)

When true, the option is shown but cannot be selected.

***

### label

> **label**: `string`

Defined in: [types.ts:62](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L62)

Human-readable label displayed in the Select, RadioGroup, or Combobox.

***

### value

> **value**: `string` \| `number`

Defined in: [types.ts:60](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L60)

The option value submitted with the form (must be string or number for HTML compatibility).

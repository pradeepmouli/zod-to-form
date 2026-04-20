[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / createBaseField

# Function: createBaseField()

> **createBaseField**(`key`, `zodType`): [`FormField`](../interfaces/FormField.md)

Defined in: [utils.ts:321](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/utils.ts#L321)

Create a base FormField with sensible defaults.
Processors fill in the specific component and props after calling this.

## Parameters

### key

`string`

The field path (e.g. `"name"`, `"address.street"`).

### zodType

`string`

The Zod `def.type` string (e.g. `"string"`, `"object"`).

## Returns

[`FormField`](../interfaces/FormField.md)

A FormField with all required properties set to their defaults.

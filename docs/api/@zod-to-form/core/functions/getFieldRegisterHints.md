[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / getFieldRegisterHints

# Function: getFieldRegisterHints()

> **getFieldRegisterHints**(`field`): [`FieldRegisterHints`](../interfaces/FieldRegisterHints.md)

Defined in: register-hints.ts:51

Derive framework-agnostic register hints from a `FormField`.

The `coerce` kind drives `setValueAs` in both the runtime renderer
(`@zod-to-form/react`) and the code generator (`@zod-to-form/codegen`).

## Parameters

### field

[`FormField`](../interfaces/FormField.md)

## Returns

[`FieldRegisterHints`](../interfaces/FieldRegisterHints.md)

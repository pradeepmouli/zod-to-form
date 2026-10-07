[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / resolveControlMode

# Function: resolveControlMode()

> **resolveControlMode**(`mapping`): [`ControlMode`](../type-aliases/ControlMode.md)

Defined in: resolve-control-mode.ts:21

Derive the control mode from a field mapping's component override.

Single source of truth so `@zod-to-form/react` (runtime) and
`@zod-to-form/codegen` (static generation) make the same decision without
duplicating the `componentOverride?.controlled === true` check.

## Parameters

### mapping

#### componentOverride?

[`ComponentOverride`](../type-aliases/ComponentOverride.md)

## Returns

[`ControlMode`](../type-aliases/ControlMode.md)

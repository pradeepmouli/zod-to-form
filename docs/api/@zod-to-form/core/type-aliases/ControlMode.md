[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ControlMode

# Type Alias: ControlMode

> **ControlMode** = `"register"` \| `"controller"`

Defined in: resolve-control-mode.ts:10

The control strategy for a field's component:
- `'register'` — use RHF's `register()` spread (uncontrolled by default)
- `'controller'` — use `Controller` / `useController` (required for Radix/shadcn components)

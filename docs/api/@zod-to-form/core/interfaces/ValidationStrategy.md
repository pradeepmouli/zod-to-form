[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ValidationStrategy

# Interface: ValidationStrategy

Defined in: [types.ts:34](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/types.ts#L34)

Specifies how a field's validation is handled at submit and change time.
Set by the L1/L2 optimizers; undefined means use the whole-schema zodResolver.

## Properties

### mode

> **mode**: `"zodSchema"` \| `"native"` \| `"component-enforced"`

Defined in: [types.ts:41](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/types.ts#L41)

How validation is performed for this field:
- `'zodSchema'` — per-field Zod schema via `register({ validate })` (L1)
- `'native'` — HTML/RHF native rules from the constraint bag (L2)
- `'component-enforced'` — the component handles validation itself (no RHF rules emitted)

***

### rules?

> `optional` **rules?**: [`NativeRules`](NativeRules.md)

Defined in: [types.ts:43](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/types.ts#L43)

Native RHF validation rules, populated by the L2 optimizer when `mode === 'native'`.

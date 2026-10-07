[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FieldRegisterHints

# Interface: FieldRegisterHints

Defined in: register-hints.ts:23

Framework-agnostic descriptor of the register options a field requires.

React translates this into actual RHF `register()` options (via `setValueAs`
functions); codegen emits the equivalent static source code.  Neither the
type nor the builder has any dependency on RHF or React.

The `coerce` kind replaces the old `valueAsNumber`/`valueAsDate` flags.
Both consumers **must** produce the canonical `setValueAs` semantics below —
this eliminates the P1 (NaN on empty optional number) and P2 (bigint
precision) bugs caused by `valueAsNumber: true`.

Canonical `setValueAs` semantics (single source of truth):
- **number**: `(v) => (v === '' || v == null ? undefined : Number(v))`
- **bigint**: `(v) => { if (v === '' || v == null) return undefined; try { return BigInt(v); } catch { return v; } }`
- **date**:   `(v) => (v === '' || v == null ? undefined : new Date(v))`
- **file**:   `(v) => (v instanceof FileList ? (v.length > 0 ? v.item(0) : undefined) : v)`

## Properties

### coerce?

> `optional` **coerce?**: `"number"` \| `"bigint"` \| `"date"` \| `"file"`

Defined in: register-hints.ts:29

Coercion kind — consumers produce a `setValueAs` function matching the
canonical semantics documented above.  Empty strings and null/undefined
always map to `undefined` so optional fields validate correctly.

***

### nativeRules?

> `optional` **nativeRules?**: [`NativeRules`](NativeRules.md)

Defined in: register-hints.ts:34

Native HTML / RHF validation rules extracted from Zod constraints (L2).
Keys mirror `NativeRules` exactly.

***

### validate?

> `optional` **validate?**: `true`

Defined in: register-hints.ts:40

`validate: true` — marker indicating per-field Zod schema validation (L1)
should be wired in.  The actual validate function is constructed by the
consumer because it closes over the live Zod schema object.

# Functions

## Helpers

### `getFieldRegisterHints`
Derive framework-agnostic register hints from a `FormField`.

The `coerce` kind drives `setValueAs` in both the runtime renderer
(`@zod-to-form/react`) and the code generator (`@zod-to-form/codegen`).
```ts
getFieldRegisterHints(field: FormField): FieldRegisterHints
```
**Parameters:**
- `field: FormField`
**Returns:** `FieldRegisterHints`

### `resolveBaseProps`
Static, schema-derived base props every field's component receives, identical
across all zodTypes. `aria-invalid` is intentionally excluded — it derives from
runtime error state, so each renderer materializes it.
```ts
resolveBaseProps(field: FormField): Record<string, unknown>
```
**Parameters:**
- `field: FormField`
**Returns:** `Record<string, unknown>`

### `resolveNativeAttrs`
Extract DOM-valid native attributes from a field's props.

Only keys listed in `NATIVE_INPUT_ATTRS` are included; internal props (e.g.
`_isSet`) and component-specific props are silently ignored. Null and
undefined values are skipped so the result only contains meaningful attrs.
```ts
resolveNativeAttrs(field: FormField): Record<string, unknown>
```
**Parameters:**
- `field: FormField`
**Returns:** `Record<string, unknown>`

### `resolveControlMode`
Derive the control mode from a field mapping's component override.

Single source of truth so `@zod-to-form/react` (runtime) and
`@zod-to-form/codegen` (static generation) make the same decision without
duplicating the `componentOverride?.controlled === true` check.
```ts
resolveControlMode(mapping: { componentOverride?: ComponentOverride }): ControlMode
```
**Parameters:**
- `mapping: { componentOverride?: ComponentOverride }`
**Returns:** `ControlMode`

### `resolveOptionsProps`
Extract options props from a field for enum/union select-style components.

Returns `{ options: field.options }` when the field carries options, or `{}`
for fields without options (e.g. plain string/number inputs). This is the
single source so runtime and codegen agree on how options flow to a component.
```ts
resolveOptionsProps(field: FormField): Record<string, unknown>
```
**Parameters:**
- `field: FormField`
**Returns:** `Record<string, unknown>`

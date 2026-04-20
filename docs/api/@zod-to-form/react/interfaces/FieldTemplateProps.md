[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / FieldTemplateProps

# Interface: FieldTemplateProps

Defined in: [packages/react/src/FieldRenderer.tsx:245](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/react/src/FieldRenderer.tsx#L245)

Props passed to the field template component that wraps each rendered form field.
The template controls layout: label position, description placement, error display, etc.
Override the default template by providing a `FieldTemplate` export in `componentModule`.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/react/src/FieldRenderer.tsx:247](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/react/src/FieldRenderer.tsx#L247)

The rendered field input (passed as `children`).

***

### deprecated?

> `optional` **deprecated?**: `boolean`

Defined in: [packages/react/src/FieldRenderer.tsx:263](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/react/src/FieldRenderer.tsx#L263)

Whether the field is deprecated (drives strikethrough on the label).

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/react/src/FieldRenderer.tsx:251](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/react/src/FieldRenderer.tsx#L251)

Optional description text from `.describe()` or `.meta({ description })`.

***

### disabled?

> `optional` **disabled?**: `boolean`

Defined in: [packages/react/src/FieldRenderer.tsx:261](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/react/src/FieldRenderer.tsx#L261)

Whether the field is disabled (drives `disabled` on the wrapper).

***

### error?

> `optional` **error?**: `string`

Defined in: [packages/react/src/FieldRenderer.tsx:255](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/react/src/FieldRenderer.tsx#L255)

Validation error message from RHF `formState.errors`, if present.

***

### helpText?

> `optional` **helpText?**: `string`

Defined in: [packages/react/src/FieldRenderer.tsx:253](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/react/src/FieldRenderer.tsx#L253)

Optional help text from `FormMeta.helpText`, displayed below the input.

***

### label

> **label**: `string`

Defined in: [packages/react/src/FieldRenderer.tsx:249](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/react/src/FieldRenderer.tsx#L249)

Human-readable field label derived from the schema key or `title` metadata.

***

### name

> **name**: `string`

Defined in: [packages/react/src/FieldRenderer.tsx:257](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/react/src/FieldRenderer.tsx#L257)

Field path used as the `htmlFor` target on the label.

***

### required?

> `optional` **required?**: `boolean`

Defined in: [packages/react/src/FieldRenderer.tsx:259](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/react/src/FieldRenderer.tsx#L259)

Whether the field is required (drives asterisk or `aria-required`).

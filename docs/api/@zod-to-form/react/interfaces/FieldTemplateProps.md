[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / FieldTemplateProps

# Interface: FieldTemplateProps

Defined in: packages/react/src/FieldRenderer.tsx:283

Props passed to the field template component that wraps each rendered form field.
The template controls layout: label position, description placement, error display, etc.
Override the default template by providing a `FieldTemplate` export in `componentModule`.

## Properties

### children

> **children**: `ReactNode`

Defined in: packages/react/src/FieldRenderer.tsx:285

The rendered field input (passed as `children`).

***

### deprecated?

> `optional` **deprecated?**: `boolean`

Defined in: packages/react/src/FieldRenderer.tsx:301

Whether the field is deprecated (drives strikethrough on the label).

***

### description?

> `optional` **description?**: `string`

Defined in: packages/react/src/FieldRenderer.tsx:289

Optional description text from `.describe()` or `.meta({ description })`.

***

### disabled?

> `optional` **disabled?**: `boolean`

Defined in: packages/react/src/FieldRenderer.tsx:299

Whether the field is disabled (drives `disabled` on the wrapper).

***

### error?

> `optional` **error?**: `string`

Defined in: packages/react/src/FieldRenderer.tsx:293

Validation error message from RHF `formState.errors`, if present.

***

### helpText?

> `optional` **helpText?**: `string`

Defined in: packages/react/src/FieldRenderer.tsx:291

Optional help text from `FormMeta.helpText`, displayed below the input.

***

### label

> **label**: `string`

Defined in: packages/react/src/FieldRenderer.tsx:287

Human-readable field label derived from the schema key or `title` metadata.

***

### name

> **name**: `string`

Defined in: packages/react/src/FieldRenderer.tsx:295

Field path used as the `htmlFor` target on the label.

***

### required?

> `optional` **required?**: `boolean`

Defined in: packages/react/src/FieldRenderer.tsx:297

Whether the field is required (drives asterisk or `aria-required`).

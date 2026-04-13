# Types & Enums

## Types

### `FormField`
**Properties:**
- `key: string` — Field path, e.g. "name", "address.street", "items.0.name"
- `component: string` — Component name from ComponentMap, e.g. "Input", "Select", "Textarea"
- `props: Record<string, unknown>` — Pass-through props for the component
- `label: string` — Display label
- `description: string` (optional) — Help text from .describe() or .meta()
- `placeholder: string` (optional) — Placeholder from examples[0] or metadata
- `required: boolean` — Whether the field is required
- `defaultValue: unknown` (optional) — Default value from z.default() or metadata
- `readOnly: boolean` — Read-only from z.readonly() or metadata
- `hidden: boolean` — Hidden but present in form state
- `order: number` (optional) — Display order override from form registry
- `disabled: boolean` — Non-interactive state (greyed out)
- `helpText: string` (optional) — Help text rendered below the input, distinct from description (below label)
- `deprecated: boolean` — Whether the field is marked as deprecated in the schema registry
- `options: FormFieldOption[]` (optional) — Options for enum/union select fields
- `children: FormField[]` (optional) — Children for nested objects
- `arrayItem: FormField` (optional) — Template for array items
- `constraints: FormFieldConstraints` — Validation constraints extracted from Zod v4 constraint bag (_zod.bag)
- `zodType: string` — Original Zod def.type for reference
- `hasCustomRender: boolean` (optional) — Whether a custom render function is registered for this field (runtime only)
- `render: (field: FormField, props: Record<string, unknown>) => unknown` (optional) — Custom render function from FormMeta (runtime only, not serialisable)
- `zodSchema: $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>` (optional) — Atomic Zod schema for this field, set by L1 optimizer
- `validation: ValidationStrategy` (optional) — Validation strategy set by optimizers (undefined = use zodResolver)

### `FormMeta`
```ts
FieldConfig<T> & { render?: (field: FormField, props: unknown) => unknown }
```

### `FieldConfig`
Per-field configuration that customises how a Zod schema field is rendered.

Merges base options (component override, visibility, order, props) with type-aware
extras: nested `fields` for object schemas, and `arrayItems` for array schemas.
Use this type when annotating a `ZodFormsConfig.fields` record or a per-schema
`schemas.[key].fields` map.
```ts
FieldConfigBase & FieldConfigExtras<T>
```

## types.d

### `FormFieldOption`
**Properties:**
- `value: string | number`
- `label: string`
- `disabled: boolean` (optional)

### `FormFieldConstraints`
**Properties:**
- `min: number` (optional)
- `max: number` (optional)
- `minLength: number` (optional)
- `maxLength: number` (optional)
- `pattern: string` (optional)
- `format: string` (optional)
- `step: number` (optional)

## FieldRenderer

### `RuntimeComponentConfig`

### `FieldTemplateProps`
**Properties:**
- `children: ReactNode`
- `label: string`
- `description: string` (optional)
- `helpText: string` (optional)
- `error: string` (optional)
- `name: string`
- `required: boolean` (optional)
- `disabled: boolean` (optional)
- `deprecated: boolean` (optional)

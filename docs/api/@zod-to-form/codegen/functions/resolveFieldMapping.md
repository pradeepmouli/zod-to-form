[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / resolveFieldMapping

# Function: resolveFieldMapping()

> **resolveFieldMapping**\<`TComponents`\>(`fieldKey`, `componentName`, `componentConfig`): `object`

Defined in: [codegen/src/generate.ts:194](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/codegen/src/generate.ts#L194)

Resolve the component name and override config for a single `FormField` key.

Walks the `componentConfig.fields` map (by exact key, then normalized key) to
find a per-field override, then falls back to the `componentConfig.components.overrides`
map keyed by component name. Returns `{ source: 'none' }` when no config is present.

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### fieldKey

`string`

Dot-path key from `FormField.key` (e.g. `'address.street'`).

### componentName

`string` \| `undefined`

Inferred component name from the schema walker.

### componentConfig

[`ZodFormsConfig`](../../cli/type-aliases/ZodFormsConfig.md)\<`TComponents`\> \| `undefined`

Optional `ZodFormsConfig` with `fields` and `components` overrides.

## Returns

`object`

Resolved component name, override config, and the resolution source.

### componentName?

> `optional` **componentName?**: `string`

### componentOverride?

> `optional` **componentOverride?**: [`ComponentOverride`](../../cli/type-aliases/ComponentOverride.md)

### override?

> `optional` **override?**: [`FieldConfig`](../../cli/type-aliases/FieldConfig.md)

### source

> **source**: `"fields"` \| `"components"` \| `"none"`

## Remarks

Resolution order: (1) `componentConfig.fields[fieldKey]` exact match,
(2) `componentConfig.fields[normalizedKey]` for array-indexed paths (e.g. `items[].name`),
(3) `componentConfig.components.overrides[componentName]` for component-level metadata.
A field-level override wins over a component-level override on conflict.

## Use When

- Building a custom codegen backend that needs the same override resolution logic as the CLI
- Writing tests that verify field-to-component mapping for a given config

## Avoid When

- You are using the CLI or Vite plugin — this is called internally and you don't need it

## Example

```ts
const mapping = resolveFieldMapping('address.street', 'Input', componentConfig);
if (mapping.source !== 'none') {
  console.log('Override component:', mapping.componentName);
}
```

## Never

- NEVER assume `source: 'none'` means the field has no component — the schema walker may
  have inferred one; `resolveFieldMapping` only resolves user-provided config overrides

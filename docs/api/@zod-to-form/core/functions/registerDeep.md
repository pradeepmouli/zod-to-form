[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / registerDeep

# Function: registerDeep()

> **registerDeep**\<`S`, `Meta`\>(`registry`, `schema`, `config`): `void`

Defined in: [register.ts:81](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/register.ts#L81)

Register a schema and all its nested fields in a registry using a
path-structured [FieldConfig](../type-aliases/FieldConfig.md) tree.

Only the flat metadata fields (`fieldType`, `order`, `hidden`, `section`,
`props`, etc.) are passed to `registry.add()` for each schema. The
structural keys `fields` and `arrayItems` are used purely to drive the
recursive walk and are never stored in the registry.

## Type Parameters

### S

`S` *extends* `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

### Meta

`Meta` *extends* `object`

## Parameters

### registry

`$ZodRegistry`\<`Meta`\>

### schema

`S`

### config

[`FieldConfig`](../type-aliases/FieldConfig.md)\<`S`\>

## Returns

`void`

## Example

```ts
const formRegistry = z.registry<FormMeta>();

const schema = z.object({
  name: z.string(),
  address: z.object({ street: z.string(), city: z.string() }),
  tags: z.array(z.string()),
});

registerDeep(formRegistry, schema, {
  component: 'form',
  fields: {
    name:    { component: 'Input', order: 0 },
    address: {
      component: 'Fieldset',
      fields: {
        street: { component: 'Input' },
        city:   { component: 'Input', hidden: true },
      },
    },
    tags: {
      component: 'ArrayField',
      arrayItems: { component: 'Input' },
    },
  },
});
```

## Remarks

Recursively walks a FieldConfig tree, separating traversal keys (fields, arrayItems)
from flat metadata keys (component, order, hidden). Only flat keys are stored in the
registry — structural keys drive the recursion. Warns on config keys that don't match
schema shape (helpful for typo detection).

## Use When

- You have a deeply-nested FieldConfig mirroring your schema shape
- Recommended for complex schemas with nested objects and arrays

## Avoid When

- For simple flat configs — registerFlat() is simpler and more direct
- Don't use if your config comes from dot-path format (CLI global fields)

## Pitfalls

- NEVER mix with registerFlat() on the same schema — registry entries conflict silently
- NEVER forget the structural keys (fields, arrayItems) for nested config — without them, child config is silently ignored

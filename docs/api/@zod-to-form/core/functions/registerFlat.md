[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / registerFlat

# Function: registerFlat()

> **registerFlat**\<`Meta`\>(`registry`, `schema`, `fields`): `void`

Defined in: [register.ts:188](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/register.ts#L188)

Register flat dot-path field configs against a schema's registry.

Typically called with the merged output of `resolveFieldConfig()`,
a flat `Record<string, FieldConfig>` keyed by dot-paths like
`"name"`, `"address.street"`, `"tags[]"` — and resolves each path against
the schema structure, calling `registry.add()` for the target schema node.

This bridges the existing flat config format (used by CLI and
`ZodFormsConfig.fields`) into the registry so that `walkSchema` can
consume it uniformly.

## Type Parameters

### Meta

`Meta` *extends* `object`

## Parameters

### registry

`$ZodRegistry`\<`Meta`\>

### schema

`$ZodType`

### fields

`Record`\<`string`, [`FieldConfig`](../type-aliases/FieldConfig.md)\>

## Returns

`void`

## Example

```ts
const formRegistry = z.registry<FormMeta>();
const schema = z.object({
  name: z.string(),
  address: z.object({ street: z.string(), city: z.string() }),
});

registerFlat(formRegistry, schema, {
  name:             { component: 'Input', order: 0 },
  'address.street': { component: 'Input' },
  'address.city':   { component: 'Input', hidden: true },
});
```

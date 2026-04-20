[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / registerFlat

# Function: registerFlat()

> **registerFlat**\<`Meta`\>(`registry`, `schema`, `fields`): `void`

Defined in: [register.ts:230](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/register.ts#L230)

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

The Zod registry to register field metadata into.

### schema

`$ZodType`

The root Zod schema whose nested nodes are resolved by dot-path.

### fields

`Record`\<`string`, [`FieldConfig`](../type-aliases/FieldConfig.md)\>

Flat `Record<string, FieldConfig>` keyed by dot-path (e.g. `"address.street"`, `"tags[]"`).

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

## Remarks

Maps flat dot-path keys (e.g., "address.street", "tags[]") to their target schemas
via resolveSchemaPath(). This bridges the flat config format (used by CLI and global fields)
into the registry. Warns on unresolved paths — check logs for typo detection.

## Use When

- Merging global field configs from z2f.config.ts into a registry
- Your config uses dot-path notation rather than nested structure

## Avoid When

- Your config is already nested mirroring schema shape — use registerDeep() instead

## Never

- NEVER mix with registerDeep() on the same schema — registry entries conflict silently
- NEVER assume numeric path segments matter — "items.0.name" and "items.2.name" resolve to the same target

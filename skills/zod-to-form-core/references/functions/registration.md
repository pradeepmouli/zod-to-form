# Functions

## Registration

### `registerDeep`
Register a schema and all its nested fields in a registry using a
path-structured FieldConfig tree.

Only the flat metadata fields (`fieldType`, `order`, `hidden`, `section`,
`props`, etc.) are passed to `registry.add()` for each schema. The
structural keys `fields` and `arrayItems` are used purely to drive the
recursive walk and are never stored in the registry.

Recursively walks a FieldConfig tree, separating traversal keys (fields, arrayItems)
from flat metadata keys (component, order, hidden). Only flat keys are stored in the
registry — structural keys drive the recursion. Warns on config keys that don't match
schema shape (helpful for typo detection).
```ts
registerDeep<S, Meta>(registry: $ZodRegistry<Meta>, schema: S, config: FieldConfig<S>): void
```
**Parameters:**
- `registry: $ZodRegistry<Meta>`
- `schema: S`
- `config: FieldConfig<S>`
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

### `registerFlat`
Register flat dot-path field configs against a schema's registry.

Typically called with the merged output of `resolveFieldConfig()`,
a flat `Record&lt;string, FieldConfig&gt;` keyed by dot-paths like
`"name"`, `"address.street"`, `"tags[]"` — and resolves each path against
the schema structure, calling `registry.add()` for the target schema node.

This bridges the existing flat config format (used by CLI and
`ZodFormsConfig.fields`) into the registry so that `walkSchema` can
consume it uniformly.

Maps flat dot-path keys (e.g., "address.street", "tags[]") to their target schemas
via resolveSchemaPath(). This bridges the flat config format (used by CLI and global fields)
into the registry. Warns on unresolved paths — check logs for typo detection.
```ts
registerFlat<Meta>(registry: $ZodRegistry<Meta>, schema: $ZodType, fields: Record<string, FieldConfig>): void
```
**Parameters:**
- `registry: $ZodRegistry<Meta>` — The Zod registry to register field metadata into.
- `schema: $ZodType` — The root Zod schema whose nested nodes are resolved by dot-path.
- `fields: Record<string, FieldConfig>` — Flat `Record&lt;string, FieldConfig&gt;` keyed by dot-path (e.g. `"address.street"`, `"tags[]"`).
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

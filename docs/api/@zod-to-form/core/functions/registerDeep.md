[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / registerDeep

# Function: registerDeep()

> **registerDeep**\<`S`, `Meta`\>(`registry`, `schema`, `config`): `void`

Defined in: [register.ts:61](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/register.ts#L61)

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

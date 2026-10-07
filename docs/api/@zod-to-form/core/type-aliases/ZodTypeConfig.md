[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ZodTypeConfig

# Type Alias: ZodTypeConfig\<TFieldKeys, TComponents\>

> **ZodTypeConfig**\<`TFieldKeys`, `TComponents`\> = `object`

Defined in: config.ts:116

Configuration for a single named schema export in `defineConfig({ schemas: ... })`.

This type mixes two scopes:
- **root-export generation settings** like `name`, `mode`, `out`, and `serverAction`
- **schema-identity defaults** like `component` and nested `fields`, which follow
  the same exported schema object anywhere it is reused as a subschema

Usage-site path overrides still win over these schema defaults.

## Type Parameters

### TFieldKeys

`TFieldKeys` *extends* `string` = `string`

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### component?

> `optional` **component?**: `string`

Defined in: config.ts:135

Default renderer for this schema wherever the same exported schema object
is encountered.

When set on a reusable subschema export (for example `ExpressionSchema`),
any parent schema that references that exact schema instance will render it
with this component unless a usage-site path override wins.

***

### fields?

> `optional` **fields?**: `Partial`\<`Record`\<`TFieldKeys`, [`TypedFieldConfig`](TypedFieldConfig.md)\<`TComponents`\>\>\>

Defined in: config.ts:150

Schema-local field configuration applied relative to this schema's own
shape.

For a root schema, these entries merge over global `fields`. For a reused
exported subschema, the same config follows that schema by identity and
becomes its default nested behavior everywhere it appears.

***

### mode?

> `optional` **mode?**: `"submit"` \| `"auto-save"`

Defined in: config.ts:137

Root-only generation mode override for this schema export.

***

### name?

> `optional` **name?**: `string`

Defined in: config.ts:126

Override the generated top-level form component name when this schema is
selected as the root export in CLI or Vite codegen.

Root-only: nested appearances of the same subschema do not use this name.

***

### out?

> `optional` **out?**: `string`

Defined in: config.ts:139

Root-only output path override for this schema export.

***

### serverAction?

> `optional` **serverAction?**: `boolean`

Defined in: config.ts:141

Root-only server action override for this schema export.

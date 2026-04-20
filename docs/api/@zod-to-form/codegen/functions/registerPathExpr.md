[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / registerPathExpr

# Function: registerPathExpr()

> **registerPathExpr**(`path`): `string`

Defined in: [codegen/src/templates.ts:162](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/codegen/src/templates.ts#L162)

Produce the correct `register(...)` call expression for a field path.
Uses template-literal syntax when the path contains `${` (e.g. array item paths),
and single-quoted string syntax otherwise.

## Parameters

### path

`string`

The field path string (e.g. `"name"`, `"items.${index}.value"`).

## Returns

`string`

A `register('...')` or `register(\`...\`)` expression string for inclusion in JSX.

## Examples

```ts
registerPathExpr('name') → "register('name')"
```

```ts
registerPathExpr('items.${index}.name') → "register(`items.${index}.name`)"
```

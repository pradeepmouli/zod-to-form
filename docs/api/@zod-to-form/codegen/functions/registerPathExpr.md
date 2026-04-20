[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / registerPathExpr

# Function: registerPathExpr()

> **registerPathExpr**(`path`): `string`

Defined in: [codegen/src/templates.ts:162](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/codegen/src/templates.ts#L162)

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
